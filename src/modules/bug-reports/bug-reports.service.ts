import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateBugReportDto, UpdateBugReportStatusDto } from './dto/bug-report.dto';

@Injectable()
export class BugReportsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(dto: CreateBugReportDto, file?: Express.Multer.File) {
    let screenshotUrl: string | undefined;

    if (file) {
      const key = `bug-reports/${Date.now()}-${file.originalname}`;
      await this.storageService.uploadFile(key, file.buffer, file.mimetype);
      screenshotUrl = key;
    }

    return this.prisma.bugReport.create({
      data: {
        ...dto,
        screenshotUrl,
      },
    });
  }

  async findAll() {
    const reports = await this.prisma.bugReport.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      reports.map(async (report) => {
        if (report.screenshotUrl && !report.screenshotUrl.startsWith('http')) {
          report.screenshotUrl = await this.storageService.getPresignedUrl(report.screenshotUrl, 604800);
        }
        return report;
      }),
    );
  }

  async findOne(id: string) {
    const report = await this.prisma.bugReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Bug report not found');
    }

    if (report.screenshotUrl && !report.screenshotUrl.startsWith('http')) {
      report.screenshotUrl = await this.storageService.getPresignedUrl(report.screenshotUrl, 604800);
    }

    return report;
  }

  async updateStatus(id: string, updateDto: UpdateBugReportStatusDto) {
    const report = await this.prisma.bugReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Bug report not found');
    }

    return this.prisma.bugReport.update({
      where: { id },
      data: { status: updateDto.status },
    });
  }

  async findByEmail(email: string) {
    const reports = await this.prisma.bugReport.findMany({
      where: { userEmail: email },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      reports.map(async (report) => {
        if (report.screenshotUrl && !report.screenshotUrl.startsWith('http')) {
          report.screenshotUrl = await this.storageService.getPresignedUrl(report.screenshotUrl, 604800);
        }
        return report;
      }),
    );
  }

  async reopenReport(id: string, email: string, message: string) {
    const report = await this.prisma.bugReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Bug report not found');
    }

    if (report.userEmail !== email) {
      throw new NotFoundException('Bug report not found for this user');
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const appendText = `\n\n[REOPENED - ${today}]: ${message}`;

    return this.prisma.bugReport.update({
      where: { id },
      data: { 
        status: 'REOPENED',
        description: (report.description || '') + appendText 
      },
    });
  }

  async closeReport(id: string, email: string) {
    const report = await this.prisma.bugReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Bug report not found');
    }

    if (report.userEmail !== email) {
      throw new NotFoundException('Bug report not found for this user');
    }

    if (report.screenshotUrl) {
      try {
        await this.storageService.deleteFile(report.screenshotUrl);
      } catch (err) {
        console.error(`Failed to delete screenshot from S3 for bug ${id}`, err);
      }
    }

    return this.prisma.bugReport.update({
      where: { id },
      data: { 
        status: 'CLOSED',
        screenshotUrl: null 
      },
    });
  }

  async autoCloseStaleReports() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleReports = await this.prisma.bugReport.findMany({
      where: {
        status: 'SOLVED',
        updatedAt: {
          lt: sevenDaysAgo
        }
      }
    });

    let closedCount = 0;
    for (const report of staleReports) {
      if (report.screenshotUrl) {
        try {
          await this.storageService.deleteFile(report.screenshotUrl);
        } catch (err) {
          console.error(`Cron: Failed to delete S3 screenshot for stale bug ${report.id}`, err);
        }
      }

      await this.prisma.bugReport.update({
        where: { id: report.id },
        data: {
          status: 'CLOSED',
          screenshotUrl: null
        }
      });
      closedCount++;
    }

    return closedCount;
  }
}

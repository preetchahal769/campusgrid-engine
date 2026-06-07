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
          report.screenshotUrl = await this.storageService.getPresignedUrl(report.screenshotUrl);
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
      report.screenshotUrl = await this.storageService.getPresignedUrl(report.screenshotUrl);
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
}

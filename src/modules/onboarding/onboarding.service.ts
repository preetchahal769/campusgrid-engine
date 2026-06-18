import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStagedOnboardingBatchDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async createStagedBatch(dto: CreateStagedOnboardingBatchDto, user: any) {
    if (!user.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create StagedOnboardingBatch
      const batch = await tx.stagedOnboardingBatch.create({
        data: {
          fileName: dto.fileName,
          recordCount: dto.records.length,
          schoolId: user.School_id,
          createdBy: user.id,
        },
      });

      // 2. Create StagedOnboardingRecords
      await tx.stagedOnboardingRecord.createMany({
        data: dto.records.map((r) => ({
          batchId: batch.id,
          studentName: r.studentName,
          parentPhone: r.parentPhone,
          className: r.className,
          rollNo: r.rollNo || null,
        })),
      });

      // 3. Create generic ApprovalTask linked to the batch
      await tx.approvalTask.create({
        data: {
          module: 'ONBOARDING',
          action: 'BATCH_PROVISION',
          payload: { batchId: batch.id },
          schoolId: user.School_id,
          createdBy: user.id,
        },
      });

      return batch;
    });
  }

  async findStagedBatches(schoolId: string) {
    return this.prisma.stagedOnboardingBatch.findMany({
      where: { schoolId },
      include: {
        creator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatchDetails(id: string, schoolId: string) {
    const batch = await this.prisma.stagedOnboardingBatch.findFirst({
      where: { id, schoolId },
      include: {
        records: true,
        creator: { select: { name: true, email: true } },
      },
    });

    if (!batch) {
      throw new NotFoundException('Onboarding batch not found.');
    }

    return batch;
  }

  async findDispatches(schoolId: string) {
    return this.prisma.notificationDispatchLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

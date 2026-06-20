import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { UserRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('sms-credential-delivery') private onboardingQueue: Queue,
  ) {}

  async findAllPending(currentUser: AuthenticatedUser) {
    if (!currentUser.School_id && currentUser.role !== UserRole.SUPER_ADMIN) {
      return [];
    }

    const whereClause: any = { status: 'PENDING' };
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      whereClause.School_id = currentUser.School_id;
    }

    return this.prisma.profileChangeRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            users: { select: { id: true, name: true, role: true, photoUrl: true } }
          }
        },
        teacher: {
          include: {
            users: { select: { id: true, name: true, role: true, photoUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveRequest(id: string, currentUser: AuthenticatedUser) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id },
      include: { student: true, teacher: true }
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') throw new ForbiddenException('Request is no longer pending');

    // Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN && request.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You do not have permission to approve this request');
    }

    const principalProfile = await this.prisma.principal.findFirst({
      where: { users_id: currentUser.id }
    });
    if (!principalProfile) {
      throw new ForbiddenException('User must have a principal profile to approve or reject requests.');
    }

    const targetUserId = request.student?.users_id || request.teacher?.users_id;
    if (!targetUserId) throw new BadRequestException('Request does not link to a valid student or teacher.');

    // Apply the changes
    await this.prisma.$transaction(async (prisma) => {
      // Mark as approved
      await prisma.profileChangeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          principalId: principalProfile.id
        }
      });

      // Update user for name and phone
      if (request.requestedName || request.requestedPhoneNo) {
        const updateData: any = {};
        if (request.requestedName) updateData.name = request.requestedName;
        if (request.requestedPhoneNo) updateData.phoneNo = request.requestedPhoneNo;

        await prisma.users.update({
          where: { id: targetUserId },
          data: updateData
        });
      }

      // Update teacher profile for qualifications if present
      if (request.requestedQualification || request.requestedSpecilization) {
        if (request.teacherId) {
          const updateData: any = {};
          if (request.requestedQualification) updateData.qualification = request.requestedQualification;
          if (request.requestedSpecilization) updateData.specilization = request.requestedSpecilization;

          await prisma.teachers.update({
            where: { id: request.teacherId },
            data: updateData
          });
        }
      }
    });

    return { success: true, message: 'Request approved successfully' };
  }

  async rejectRequest(id: string, currentUser: AuthenticatedUser) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id },
      include: { student: true, teacher: true }
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') throw new ForbiddenException('Request is no longer pending');

    // Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN && request.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You do not have permission to reject this request');
    }

    const principalProfile = await this.prisma.principal.findFirst({
      where: { users_id: currentUser.id }
    });
    if (!principalProfile) {
      throw new ForbiddenException('User must have a principal profile to approve or reject requests.');
    }

    const targetUserId = request.student?.users_id || request.teacher?.users_id;
    if (!targetUserId) throw new BadRequestException('Request does not link to a valid student or teacher.');

    await this.prisma.$transaction(async (prisma) => {
      // Mark as rejected
      await prisma.profileChangeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          principalId: principalProfile.id
        }
      });

      // If it was a first-time phone entry, the user's current phone in DB might be the rejected phone
      // To strictly follow the plan, if the user's phone equals requested phone, wipe it out
      const user = await prisma.users.findUnique({ where: { id: targetUserId } });
      if (user && user.phoneNo === request.requestedPhoneNo) {
        await prisma.users.update({
          where: { id: user.id },
          data: { phoneNo: null }
        });
      }
    });

    return { success: true, message: 'Request rejected successfully' };
  }

  async createApprovalTask(dto: any, currentUser: any) {
    if (!currentUser.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

    const clerk = await this.prisma.clerks.findFirst({
      where: { users_id: currentUser.id }
    });
    if (!clerk) {
      throw new ForbiddenException('User must have a clerk profile to create an approval task.');
    }

    return this.prisma.approvalTask.create({
      data: {
        module: dto.module,
        action: dto.action,
        payload: dto.payload,
        schoolId: currentUser.School_id,
        clerkId: clerk.id,
      },
    });
  }

  async findAllPendingTasks(currentUser: any) {
    if (!currentUser.School_id) {
      return [];
    }
    return this.prisma.approvalTask.findMany({
      where: {
        schoolId: currentUser.School_id,
        status: 'PENDING',
      },
      include: {
        clerk: {
          include: {
            users: { select: { id: true, name: true, role: true, email: true } }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleApprovalTask(id: string, status: ApprovalStatus, currentUser: any) {
    if (status === ApprovalStatus.PENDING) {
      throw new BadRequestException('Cannot set task status to PENDING.');
    }

    const task = await this.prisma.approvalTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Approval task not found.');
    }

    if (task.status !== 'PENDING') {
      throw new ForbiddenException('Approval task is no longer pending.');
    }

    if (task.schoolId !== currentUser.School_id) {
      throw new ForbiddenException('You do not have permission to approve/reject this task.');
    }

    const principalProfile = await this.prisma.principal.findFirst({
      where: { users_id: currentUser.id }
    });
    if (!principalProfile) {
      throw new ForbiddenException('User must have a principal profile to approve or reject tasks.');
    }

    if (status === 'REJECTED') {
      return this.prisma.approvalTask.update({
        where: { id },
        data: {
          status: 'REJECTED',
          principalId: principalProfile.id,
        },
      });
    }

    const jobsToQueue: any[] = [];

    // Execute APPROVED actions dynamically inside transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mark task as APPROVED
      const updatedTask = await tx.approvalTask.update({
        where: { id },
        data: {
          status: 'APPROVED',
          principalId: principalProfile.id,
        },
      });

      // 2. Dynamic execution hooks
      if (task.module === 'ONBOARDING' && task.action === 'BATCH_PROVISION') {
        const payload = task.payload as any;
        const batchId = payload.batchId;

        const batch = await tx.stagedOnboardingBatch.findUnique({
          where: { id: batchId },
          include: { records: true },
        });

        if (!batch) {
          throw new NotFoundException('Staged onboarding batch not found.');
        }

        // Get the first section in the school as fallback
        const fallbackSection = await tx.section.findFirst({
          where: { grade: { School_id: task.schoolId } },
        });

        for (const record of batch.records) {
          // Find matching section in the school
          let targetSection = await tx.section.findFirst({
            where: {
              name: { equals: record.className, mode: 'insensitive' },
              grade: { School_id: task.schoolId },
            },
          });

          if (!targetSection) {
            targetSection = fallbackSection;
          }

          if (!targetSection) {
            throw new BadRequestException(
              `Cannot onboard student ${record.studentName}. Please configure academic grades and sections first.`
            );
          }

          // Generate access credentials
          const nameSnippet = record.studentName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
          const uniqueId = Math.floor(1000 + Math.random() * 9000);
          const generatedUsername = `${nameSnippet}${uniqueId}`;
          const generatedEmail = `${generatedUsername}@school.edu`;
          const temporaryPassword = Math.random().toString(36).slice(-8).toUpperCase();
          const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

          // Create security core user
          const newUser = await tx.users.create({
            data: {
              name: record.studentName,
              email: generatedEmail,
              password: hashedPassword,
              role: UserRole.STUDENT,
              School_id: task.schoolId,
            },
          });

          // Create the coupled student operational profile
          await tx.students.create({
            data: {
              users_id: newUser.id,
              rollNumber: record.rollNo || null,
              School_id: task.schoolId,
              section_id: targetSection.id,
            },
          });

          // Write to NotificationDispatchLog in status QUEUED
          // The background worker will pick up and deliver this in Phase 13!
          const logRecord = await tx.notificationDispatchLog.create({
            data: {
              recipientPhone: record.parentPhone,
              studentName: record.studentName,
              username: generatedEmail,
              schoolId: task.schoolId,
              status: 'QUEUED',
            },
          });

          jobsToQueue.push({
            logId: logRecord.id,
            recipientPhone: record.parentPhone,
            studentName: record.studentName,
            username: generatedEmail,
            password: temporaryPassword,
            schoolId: task.schoolId,
          });
        }

        // Mark batch as APPROVED
        await tx.stagedOnboardingBatch.update({
          where: { id: batchId },
          data: { status: 'APPROVED' },
        });
      }

      return updatedTask;
    });

    // 3. Queue jobs in BullMQ after successful SQL transaction commit
    for (const job of jobsToQueue) {
      await this.onboardingQueue.add('send-welcome-sms', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }

    return result;
  }
}

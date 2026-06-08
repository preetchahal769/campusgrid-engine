import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { UserRole } from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

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
        user: {
          select: { id: true, name: true, role: true, photoUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveRequest(id: string, currentUser: AuthenticatedUser) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id }
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') throw new ForbiddenException('Request is no longer pending');

    // Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN && request.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You do not have permission to approve this request');
    }

    // Apply the changes
    await this.prisma.$transaction(async (prisma) => {
      // Mark as approved
      await prisma.profileChangeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: currentUser.id
        }
      });

      // Update user for name and phone
      if (request.requestedName || request.requestedPhoneNo) {
        const updateData: any = {};
        if (request.requestedName) updateData.name = request.requestedName;
        if (request.requestedPhoneNo) updateData.phoneNo = request.requestedPhoneNo;

        await prisma.users.update({
          where: { id: request.userId },
          data: updateData
        });
      }

      // Update teacher profile for qualifications if present
      if (request.requestedQualification || request.requestedSpecilization) {
        const teacher = await prisma.teachers.findFirst({ where: { users_id: request.userId } });
        if (teacher) {
          const updateData: any = {};
          if (request.requestedQualification) updateData.qualification = request.requestedQualification;
          if (request.requestedSpecilization) updateData.specilization = request.requestedSpecilization;

          await prisma.teachers.update({
            where: { id: teacher.id },
            data: updateData
          });
        }
      }
    });

    return { success: true, message: 'Request approved successfully' };
  }

  async rejectRequest(id: string, currentUser: AuthenticatedUser) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id }
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') throw new ForbiddenException('Request is no longer pending');

    // Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN && request.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You do not have permission to reject this request');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Mark as rejected
      await prisma.profileChangeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedById: currentUser.id
        }
      });

      // If it was a first-time phone entry, the user's current phone in DB might be the rejected phone
      // To strictly follow the plan, if the user's phone equals requested phone, wipe it out
      const user = await prisma.users.findUnique({ where: { id: request.userId } });
      if (user && user.phoneNo === request.requestedPhoneNo) {
        await prisma.users.update({
          where: { id: user.id },
          data: { phoneNo: null }
        });
      }
    });

    return { success: true, message: 'Request rejected successfully' };
  }
}

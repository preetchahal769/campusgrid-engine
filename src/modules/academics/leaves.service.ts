import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeaveRequestDto, UpdateLeaveStatusDto } from './dto/leave-request.dto';
import { UserRole, LeaveStatus, AttendanceStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateLeaveRequestDto, currentUser: AuthenticatedUser) {
    // 1. Find student profile
    let student;
    if (currentUser.role === UserRole.PARENT) {
      const parentRecord = await this.prisma.parent.findFirst({
        where: { users_id: currentUser.id }
      });
      if (!parentRecord) throw new ForbiddenException('Parent profile not found.');
      student = await this.prisma.students.findUnique({
        where: { id: parentRecord.students_id }
      });
    } else {
      student = await this.prisma.students.findFirst({
        where: { users_id: currentUser.id }
      });
    }
    if (!student) throw new ForbiddenException('Only students or parents can request leaves.');

    // 2. Validate dates
    const start = new Date(createDto.startDate);
    const end = new Date(createDto.endDate);
    if (end < start) throw new BadRequestException('End date cannot be before start date.');

    // 3. Create request
    return this.prisma.leaveRequest.create({
      data: {
        startDate: start,
        endDate: end,
        reason: createDto.reason,
        attachmentUrl: createDto.attachmentUrl,
        studentId: student.id,
        School_id: student.School_id
      }
    });
  }

  async updateStatus(id: string, updateDto: UpdateLeaveStatusDto, currentUser: AuthenticatedUser) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { 
        student: { include: { section: true } } 
      }
    });

    if (!leave) throw new NotFoundException('Leave request not found.');

    // Permission check: Principal or Class Incharge
    let authorized = false;

    // 1. Principal/Super Admin always authorized
    if (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.PRINCIPAL) {
      authorized = true;
    } 
    // 2. Class Incharge authorized ONLY IF leave is not escalated
    else if (currentUser.role === UserRole.TEACHER && leave.status !== LeaveStatus.ESCALATED) {
      if (leave.student.section_id) {
        const section = await this.prisma.section.findFirst({
          where: { 
            id: leave.student.section_id,
            classIncharge: { users_id: currentUser.id }
          }
        });
        if (section) authorized = true;
      }
    }

    if (!authorized) {
      const message = leave.status === LeaveStatus.ESCALATED 
        ? 'Only the Principal can approve escalated leaves.'
        : 'You are not authorized to approve/reject this leave.';
      throw new ForbiddenException(message);
    }

    // Validate partial date authorization
    if ((updateDto.approvedStartDate || updateDto.approvedEndDate) && 
        currentUser.role !== UserRole.PRINCIPAL && 
        currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the Principal is authorized to grant partial leaves.');
    }

    let approvedStart = leave.startDate;
    let approvedEnd = leave.endDate;

    if (updateDto.status === LeaveStatus.APPROVED) {
      if (updateDto.approvedStartDate) {
        approvedStart = new Date(updateDto.approvedStartDate);
      }
      if (updateDto.approvedEndDate) {
        approvedEnd = new Date(updateDto.approvedEndDate);
      }

      // Ensure partial dates fall within requested bounds
      if (approvedStart < leave.startDate || approvedEnd > leave.endDate || approvedEnd < approvedStart) {
        throw new BadRequestException('Approved dates must fall within the requested leave range.');
      }
    }

    const updatedLeave = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: updateDto.status,
        approvedById: currentUser.id,
        approvedStartDate: updateDto.status === LeaveStatus.APPROVED ? approvedStart : null,
        approvedEndDate: updateDto.status === LeaveStatus.APPROVED ? approvedEnd : null,
      }
    });

    // AUTO ATTENDANCE LOGIC
    if (updateDto.status === LeaveStatus.APPROVED) {
      await this.markAttendanceForApprovedLeave(leave, approvedStart, approvedEnd);
    } else if (updateDto.status === LeaveStatus.REJECTED) {
      await this.markAttendanceForRejectedLeave(leave);
    }

    return updatedLeave;
  }

  private async markAttendanceForApprovedLeave(leave: any, approvedStart: Date, approvedEnd: Date) {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const userId = leave.student.users_id;
    const schoolId = leave.School_id;

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const isApproved = currentDate >= approvedStart && currentDate <= approvedEnd;
      const targetStatus = isApproved ? AttendanceStatus.LEAVE : AttendanceStatus.ABSENT;

      await this.prisma.attendance.upsert({
        where: {
          users_id_date: {
            users_id: userId,
            date: new Date(currentDate)
          }
        },
        update: { status: targetStatus },
        create: {
          date: new Date(currentDate),
          status: targetStatus,
          users_id: userId,
          School_id: schoolId
        }
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private async markAttendanceForRejectedLeave(leave: any) {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const userId = leave.student.users_id;
    const schoolId = leave.School_id;

    const currentDate = new Date(start);
    while (currentDate <= end) {
      await this.prisma.attendance.upsert({
        where: {
          users_id_date: {
            users_id: userId,
            date: new Date(currentDate)
          }
        },
        update: { status: AttendanceStatus.ABSENT },
        create: {
          date: new Date(currentDate),
          status: AttendanceStatus.ABSENT,
          users_id: userId,
          School_id: schoolId
        }
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  async findAll(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.STUDENT) {
      const student = await this.prisma.students.findFirst({ where: { users_id: currentUser.id } });
      return this.prisma.leaveRequest.findMany({ where: { studentId: student?.id } });
    }

    if (currentUser.role === UserRole.PARENT) {
      const parentRecord = await this.prisma.parent.findFirst({ where: { users_id: currentUser.id } });
      return this.prisma.leaveRequest.findMany({ where: { studentId: parentRecord?.students_id } });
    }

    if (currentUser.role === UserRole.TEACHER) {
      // Find leaves for their section
      return this.prisma.leaveRequest.findMany({
        where: {
          student: {
            section: { classIncharge: { users_id: currentUser.id } }
          }
        },
        include: { student: { include: { users: { select: { name: true } } } } }
      });
    }

    // Principal/Admin see all in school
    return this.prisma.leaveRequest.findMany({
      where: { School_id: currentUser.School_id },
      include: { student: { include: { users: { select: { name: true } } } } }
    });
  }

  async escalate(id: string, currentUser: AuthenticatedUser) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!leave) throw new NotFoundException('Leave request not found.');

    // 1. Ensure the requester is the student who owns this leave
    if (leave.student.users_id !== currentUser.id) {
      throw new ForbiddenException('You can only escalate your own leave requests.');
    }

    // 2. Only REJECTED leaves can be escalated
    if (leave.status !== LeaveStatus.REJECTED) {
      throw new BadRequestException('Only rejected leaves can be escalated to the Principal.');
    }

    // 3. Move to ESCALATED status
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.ESCALATED }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredLeaves() {
    console.log('Running cron task: Auto-rejecting expired leave requests...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        status: { in: [LeaveStatus.PENDING, LeaveStatus.ESCALATED] },
        endDate: { lt: today }
      },
      include: {
        student: true
      }
    });

    console.log(`Found ${expiredLeaves.length} expired leave requests.`);

    for (const leave of expiredLeaves) {
      await this.prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: LeaveStatus.REJECTED }
      });
      await this.markAttendanceForRejectedLeave(leave);
      console.log(`Auto-rejected expired leave ID: ${leave.id}`);
    }
  }
}

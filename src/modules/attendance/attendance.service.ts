import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UserRole, AttendanceStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async markAttendanceRecord(date: Date, users_id: string, status: AttendanceStatus, currentUser: AuthenticatedUser) {
    // Verify user exists
    const targetUser = await this.prisma.users.findUnique({
      where: { id: users_id },
    });
    if (!targetUser) throw new NotFoundException(`User ${users_id} not found.`);

    // Check school isolation
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must belong to a school to mark attendance.');
      }
      if (targetUser.School_id !== currentUser.School_id) {
        throw new ForbiddenException(`Cannot mark attendance for user ${users_id} outside your school.`);
      }
    }

    const schoolId = targetUser.School_id;
    if (!schoolId) {
      throw new ForbiddenException(`Target user ${users_id} does not belong to any school.`);
    }

    // Upsert the attendance record
    return this.prisma.attendance.upsert({
      where: {
        users_id_date: {
          users_id,
          date,
        },
      },
      update: {
        status,
      },
      create: {
        users_id,
        date,
        status,
        School_id: schoolId,
      },
    });
  }

  async markAttendance(createAttendanceDto: CreateAttendanceDto, currentUser: AuthenticatedUser) {
    const { date, records } = createAttendanceDto;
    const recordDate = new Date(date);
    
    // Process them sequentially to ensure validation and upsert logic runs for each
    const results: any[] = [];
    for (const record of records) {
      try {
        const result = await this.markAttendanceRecord(recordDate, record.users_id, record.status, currentUser);
        results.push({ status: 'success', record: result });
      } catch (error: any) {
        results.push({ status: 'error', users_id: record.users_id, message: error.message });
      }
    }
    return results;
  }

  async fetchAttendance(filters: { date?: string, users_id?: string, section_id?: string }, currentUser: AuthenticatedUser) {
    const whereClause: any = {};
    
    if (filters.date) {
      whereClause.date = new Date(filters.date);
    }
    if (filters.users_id) {
      whereClause.users_id = filters.users_id;
    }
    if (filters.section_id) {
      whereClause.users = {
        students: { some: { section_id: filters.section_id } }
      };
    }

    // School isolation
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) throw new ForbiddenException('No school ID found.');
      whereClause.School_id = currentUser.School_id;
    }

    return this.prisma.attendance.findMany({
      where: whereClause,
      include: {
        users: {
          select: { 
            name: true, 
            email: true, 
            role: true,
            students: { select: { rollNumber: true, section: { select: { name: true } } } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async validateIncharge(sectionId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN) return true;

    const teacher = await this.prisma.teachers.findFirst({
      where: { users_id: currentUser.id }
    });
    if (!teacher) throw new ForbiddenException('Teacher profile not found.');

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section || section.classInchargeId !== teacher.id) {
      throw new ForbiddenException('You are not the in-charge of this class.');
    }
    return true;
  }

  async fetchMyAttendance(currentUser: AuthenticatedUser, month?: number, year?: number) {
    const whereClause: any = {
      users_id: currentUser.id
    };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    return this.prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });
  }

  async markSelfAttendance(currentUser: AuthenticatedUser, status: AttendanceStatus) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.markAttendanceRecord(today, currentUser.id, status, currentUser);
  }
}

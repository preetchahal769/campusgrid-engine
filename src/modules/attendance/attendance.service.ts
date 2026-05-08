import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UserRole, AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async markAttendanceRecord(date: Date, users_id: string, status: AttendanceStatus, currentUser: any) {
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

  async markAttendance(createAttendanceDto: CreateAttendanceDto, currentUser: any) {
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

  async fetchAttendance(date: string, users_id: string, currentUser: any) {
    const whereClause: any = {};
    
    if (date) {
      whereClause.date = new Date(date);
    }
    if (users_id) {
      whereClause.users_id = users_id;
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
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async fetchMyAttendance(currentUser: any, month?: number, year?: number) {
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
}

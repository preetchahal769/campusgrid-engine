import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { CreateBulkTimetableDto } from './dto/create-bulk-timetable.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async createBulk(dto: CreateBulkTimetableDto, currentUser: any) {
    const results: any[] = [];
    
    // We run this in a transaction so if one slot fails (conflict), nothing is saved
    return this.prisma.$transaction(async (tx) => {
      for (const slot of dto.slots) {
        const { teachersubjectsection_id, dayOfWeek, lectureNo } = slot;

        // 1. Fetch assignment
        const assignment = await tx.teachersubjectsection.findUnique({
          where: { id: teachersubjectsection_id },
          include: { teachers: true }
        });
        if (!assignment) throw new NotFoundException(`Assignment not found for TSS ID: ${teachersubjectsection_id}`);

        // 2. Conflict Checks
        const teacherBusy = await tx.timetable.findFirst({
          where: { dayOfWeek, lectureNo, teachersubjectsection: { teachers_id: assignment.teachers_id } }
        });
        if (teacherBusy) throw new ConflictException(`Teacher busy on ${dayOfWeek} at lecture ${lectureNo}`);

        const sectionOccupied = await tx.timetable.findFirst({
          where: { dayOfWeek, lectureNo, teachersubjectsection: { section_id: assignment.section_id } }
        });
        if (sectionOccupied) throw new ConflictException(`Section occupied on ${dayOfWeek} at lecture ${lectureNo}`);

        // 3. Create
        const created = await tx.timetable.create({ data: slot });
        results.push(created);
      }
      return results;
    });
  }

  async fetchForSection(sectionId: string) {
    return this.prisma.timetable.findMany({
      where: {
        teachersubjectsection: {
          section_id: sectionId
        }
      },
      include: {
        studioRoom: { select: { roomName: true } },
        teachersubjectsection: {
          include: {
            teachers: { include: { users: { select: { name: true } } } },
            subject: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { lectureNo: 'asc' }
      ]
    });
  }

  async fetchForTeacher(teacherId: string) {
    return this.prisma.timetable.findMany({
      where: {
        teachersubjectsection: {
          teachers_id: teacherId
        }
      },
      include: {
        studioRoom: { select: { roomName: true } },
        teachersubjectsection: {
          include: {
            section: { select: { name: true } },
            subject: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { lectureNo: 'asc' }
      ]
    });
  }

  async updateStudioAssignment(id: string, studioRoomId: string | null) {
    return this.prisma.timetable.update({
      where: { id },
      data: { studioRoomId },
    });
  }
}

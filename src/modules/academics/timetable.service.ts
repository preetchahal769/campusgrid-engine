import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async create(createTimetableDto: CreateTimetableDto, currentUser: any) {
    const { teachersubjectsection_id, dayOfWeek, lectureNo } = createTimetableDto;

    // 1. Fetch the assignment (Teacher-Subject-Section mapping)
    const assignment = await this.prisma.teachersubjectsection.findUnique({
      where: { id: teachersubjectsection_id },
      include: { 
        teachers: true,
        section: { include: { grade: true } }
      }
    });

    if (!assignment) throw new NotFoundException('Teacher-Subject assignment not found.');

    // 2. Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (assignment.teachers.School_id !== currentUser.School_id) {
        throw new ForbiddenException('Assignment belongs to a different school.');
      }
    }

    // 3. Timetable Conflict Checks:
    // A. Is this teacher already busy at this time (Day + LectureNo) in ANY section?
    const teacherBusy = await this.prisma.timetable.findFirst({
      where: {
        dayOfWeek,
        lectureNo,
        teachersubjectsection: {
          teachers_id: assignment.teachers_id
        }
      }
    });
    if (teacherBusy) {
      throw new ConflictException('Teacher is already assigned to another lecture at this time.');
    }

    // B. Is this section already having a lecture at this time?
    const sectionOccupied = await this.prisma.timetable.findFirst({
      where: {
        dayOfWeek,
        lectureNo,
        teachersubjectsection: {
          section_id: assignment.section_id
        }
      }
    });
    if (sectionOccupied) {
      throw new ConflictException('This section already has a lecture assigned at this time.');
    }

    // 4. Create the timetable slot
    return this.prisma.timetable.create({
      data: {
        ...createTimetableDto
      }
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
}

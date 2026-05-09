import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, AttendanceStatus } from '@prisma/client';

@Injectable()
export class SubstitutionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1. Fetch all teachers who are absent or on leave today
   */
  async findAbsentTeachers(currentUser: any) {
    if (currentUser.role !== UserRole.PRINCIPAL && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Principal or Admin can access absent teacher data.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the current day name (e.g., 'Monday')
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[today.getDay()];

    // Find teachers who are absent in attendance table
    const absentAttendance = await this.prisma.attendance.findMany({
      where: {
        date: today,
        status: { in: [AttendanceStatus.ABSENT, AttendanceStatus.LEAVE] },
        users: { role: UserRole.TEACHER, School_id: currentUser.School_id }
      },
      include: {
        users: {
          include: {
            teachers: {
              include: {
                teachersubjectsection: {
                  where: { timetable: { some: { dayOfWeek: currentDay } } },
                  include: {
                    subject: true,
                    section: { include: { grade: true } },
                    timetable: { where: { dayOfWeek: currentDay } }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Format the response
    return absentAttendance.map(att => ({
      teacherId: att.users.teachers[0].id,
      name: att.users.name,
      status: att.status,
      affectedSlots: att.users.teachers[0].teachersubjectsection.flatMap(tss => 
        tss.timetable.map(slot => ({
          timetableId: slot.id,
          lectureNo: slot.lectureNo,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: tss.subject.name,
          class: `${tss.section.grade.name} - ${tss.section.name}`,
          isSubstituted: false // We will check this below
        }))
      )
    }));
  }

  /**
   * 2. Fetch available teachers for substitution (those who don't have a class in a specific slot)
   */
  async findAvailableTeachers(lectureNo: number, dayOfWeek: string, currentUser: any) {
    // 1. Get all teachers in school
    const allTeachers = await this.prisma.teachers.findMany({
      where: { School_id: currentUser.School_id },
      include: { users: { select: { name: true } } }
    });

    // 2. Get teachers who ARE busy in this slot
    const busyTeachers = await this.prisma.timetable.findMany({
      where: {
        lectureNo,
        dayOfWeek,
        teachersubjectsection: { teachers: { School_id: currentUser.School_id } }
      },
      select: { teachersubjectsection: { select: { teachers_id: true } } }
    });

    const busyIds = busyTeachers.map(b => b.teachersubjectsection.teachers_id);

    // 3. Filter out busy teachers
    return allTeachers
      .filter(t => !busyIds.includes(t.id))
      .map(t => ({
        id: t.id,
        name: t.users.name
      }));
  }

  /**
   * 3. Assign a replacement teacher to a specific slot
   */
  async assignReplacement(data: {
    date: string;
    timetableId: string;
    subTeacherId: string;
    role?: string;
    message?: string;
  }, currentUser: any) {
    const { date, timetableId, subTeacherId, role, message } = data;
    const subDate = new Date(date);
    subDate.setHours(0, 0, 0, 0);

    // 1. Verify timetable entry exists
    const slot = await this.prisma.timetable.findUnique({
      where: { id: timetableId },
      include: { teachersubjectsection: true }
    });
    if (!slot) throw new NotFoundException('Timetable slot not found.');

    const originalTeacherId = slot.teachersubjectsection.teachers_id;

    // 2. Check if already substituted
    const existing = await this.prisma.substitution.findUnique({
      where: {
        date_timetable_id: {
          date: subDate,
          timetable_id: timetableId
        }
      }
    });
    if (existing) throw new ConflictException('This slot is already substituted for today.');

    // 3. Create substitution
    return this.prisma.substitution.create({
      data: {
        date: subDate,
        timetable_id: timetableId,
        originalTeacherId,
        subTeacherId,
        role: role || 'DISCIPLINE',
        message,
        School_id: currentUser.School_id
      }
    });
  }

  /**
   * 4. Get active substitutions for today
   */
  async getActiveSubstitutions(currentUser: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.substitution.findMany({
      where: {
        date: today,
        School_id: currentUser.School_id
      },
      include: {
        originalTeacher: { include: { users: { select: { name: true } } } },
        subTeacher: { include: { users: { select: { name: true } } } },
        timetable: {
          include: {
            teachersubjectsection: {
              include: {
                subject: true,
                section: { include: { grade: true } }
              }
            }
          }
        }
      }
    });
  }
}

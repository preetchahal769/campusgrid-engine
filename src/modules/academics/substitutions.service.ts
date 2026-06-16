import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, AttendanceStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class SubstitutionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1. Fetch all teachers who are absent or on leave today
   */
  async findAbsentTeachers(currentUser: AuthenticatedUser) {
    if (!currentUser.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

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

    // Get active substitutions for today
    const activeSubs = await this.prisma.substitution.findMany({
      where: {
        date: today,
        School_id: currentUser.School_id
      },
      select: {
        timetable_id: true,
        subTeacher: {
          select: {
            users: {
              select: { name: true }
            }
          }
        }
      }
    });

    const subMap = new Map(activeSubs.map(s => [s.timetable_id, s.subTeacher.users.name]));

    // Format the response
    return absentAttendance.map(att => {
      const teacher = att.users.teachers[0];
      if (!teacher) return null;
      return {
        teacherId: teacher.id,
        name: att.users.name,
        status: att.status,
        affectedSlots: teacher.teachersubjectsection.flatMap(tss => 
          tss.timetable.map(slot => ({
            timetableId: slot.id,
            lectureNo: slot.lectureNo,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: tss.subject.name,
            subjectId: tss.subject_id,
            sectionId: tss.section_id,
            class: `${tss.section.grade.name} - ${tss.section.name}`,
            isSubstituted: subMap.has(slot.id),
            isCovered: subMap.has(slot.id),
            coveredBy: subMap.get(slot.id) || null
          }))
        )
      };
    }).filter(Boolean);
  }

  /**
   * 2. Fetch available teachers for substitution (those who don't have a class in a specific slot)
   */
  async findAvailableTeachers(
    lectureNo: number,
    dayOfWeek: string,
    currentUser: AuthenticatedUser,
    subjectId?: string,
    sectionId?: string
  ) {
    if (!currentUser.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

    // 1. Get all teachers in school along with their user info and subjects
    const allTeachers = await this.prisma.teachers.findMany({
      where: { School_id: currentUser.School_id },
      include: {
        users: { select: { name: true } },
        teachersubjectsection: {
          include: {
            subject: true,
            section: true
          }
        }
      }
    });

    // 2. Get teachers who ARE busy in this slot today
    const busyTeachers = await this.prisma.timetable.findMany({
      where: {
        lectureNo,
        dayOfWeek,
        teachersubjectsection: { teachers: { School_id: currentUser.School_id } }
      },
      select: { teachersubjectsection: { select: { teachers_id: true } } }
    });

    const busyIds = busyTeachers.map(b => b.teachersubjectsection.teachers_id);

    // 3. Get daily workload of all teachers today (number of slots they teach today)
    const todayTimetable = await this.prisma.timetable.findMany({
      where: {
        dayOfWeek,
        teachersubjectsection: { teachers: { School_id: currentUser.School_id } }
      },
      select: { teachersubjectsection: { select: { teachers_id: true } } }
    });

    const workloadMap = new Map<string, number>();
    for (const item of todayTimetable) {
      const tid = item.teachersubjectsection.teachers_id;
      workloadMap.set(tid, (workloadMap.get(tid) || 0) + 1);
    }

    // 4. Fetch subject details if subjectId is provided
    let targetSubjectName = '';
    if (subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
        select: { name: true }
      });
      if (subject && subject.name) targetSubjectName = subject.name.toLowerCase();
    }

    // 5. Score and filter available teachers
    const available = allTeachers
      .filter(t => !busyIds.includes(t.id))
      .map(t => {
        let score = 0;
        const reasons: string[] = [];

        // A. Subject Expert check
        const teachesSameSubject = t.teachersubjectsection.some(tss => tss.subject_id === subjectId);
        if (teachesSameSubject) {
          score += 10;
          reasons.push('Subject Expert');
        }

        // B. Specialization check
        if (targetSubjectName && t.specilization && t.specilization.toLowerCase().includes(targetSubjectName)) {
          score += 5;
          reasons.push('Specialized');
        }

        // C. Grade Familiarity check
        const teachesSameSection = t.teachersubjectsection.some(tss => tss.section_id === sectionId);
        if (teachesSameSection) {
          score += 5;
          reasons.push('Familiar with Class');
        }

        const workload = workloadMap.get(t.id) || 0;
        if (workload <= 2) {
          score += 3;
          reasons.push('Low Workload Today');
        }

        return {
          id: t.id,
          name: t.users.name,
          specialization: t.specilization || 'Academic Staff',
          workloadToday: workload,
          score,
          recommendationReason: reasons[0] || 'Available'
        };
      });

    // Sort by score descending, then by workload today ascending
    return available.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.workloadToday - b.workloadToday;
    });
  }

  /**
   * 3. Assign a replacement teacher to a specific slot
   */
  async assignReplacement(data: {
    // 1. Verify timetable entry exists
    date: string;
    timetableId: string;
    subTeacherId: string;
    role?: string;
    message?: string;
  }, currentUser: AuthenticatedUser) {
    if (!currentUser.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

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
  async getActiveSubstitutions(currentUser: AuthenticatedUser) {
    if (!currentUser.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

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

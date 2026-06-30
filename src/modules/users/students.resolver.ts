import { Resolver, Query, Mutation, Args, Context, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { StudentsService } from './students.service';
import { AssignmentsService } from '../academics/assignments.service';
import { TimetableService } from '../academics/timetable.service';
import { AttendanceService } from '../attendance/attendance.service';
import { BroadcastsService } from '../communications/broadcasts.service';
import { PrismaService } from '../../database/prisma.service';
import { getOrLoadStudentProfile } from '../../common/utils/profile-loader';
import {
  StudentProfileType,
  AssignmentType,
  TimetableType,
  AttendanceResponseType,
  BroadcastType,
  PresignedUrlResponse,
  SubmissionType,
  StudentFeeBillType,
  StudentPerformanceType,
} from './dto/student-dashboard.types';

@Resolver(() => StudentProfileType)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentsResolver {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly timetableService: TimetableService,
    private readonly attendanceService: AttendanceService,
    private readonly broadcastsService: BroadcastsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => StudentProfileType, { name: 'studentProfile' })
  async getStudentProfile(@Context() context: any) {
    const user = context.req.user;
    return this.studentsService.findMyProfile(user);
  }

  @Query(() => [AssignmentType], { name: 'studentHomework' })

  async getStudentHomework(@Context() context: any) {
    const user = context.req.user;
    return this.assignmentsService.fetchForUser(user);
  }

  @Query(() => [TimetableType], { name: 'studentTimetable' })
  async getStudentTimetable(
    @Args('sectionId', { type: () => String, nullable: true }) sectionId: string,
    @Context() context: any,
  ) {
    let targetSectionId = sectionId;
    if (!targetSectionId || targetSectionId === 'me') {
      const user = context.req.user;
      const profile = await getOrLoadStudentProfile(this.prisma, user);
      if (!profile || !profile.section_id) {
        return [];
      }
      targetSectionId = profile.section_id;
    }
    return this.timetableService.fetchForSection(targetSectionId);
  }

  @Query(() => AttendanceResponseType, { name: 'studentAttendance' })
  async getStudentAttendance(
    @Args('range', { type: () => String, nullable: true }) range: string,
    @Args('month', { type: () => Int, nullable: true }) month: number,
    @Args('year', { type: () => Int, nullable: true }) year: number,
    @Context() context: any,
  ) {
    const user = context.req.user;
    return this.attendanceService.fetchMyAttendance(user, month, year, range);
  }

  @Query(() => [BroadcastType], { name: 'studentBroadcasts' })
  async getStudentBroadcasts(@Context() context: any) {
    const user = context.req.user;
    return this.broadcastsService.fetchForUser(user);
  }

  @Mutation(() => PresignedUrlResponse)
  async getUploadPresignedUrl(
    @Args('filename') filename: string,
    @Args('filetype') filetype: string,
    @Args('assignmentId') assignmentId: string,
    @Context() context: any,
  ) {
    const user = context.req.user;
    return this.assignmentsService.generatePresignedUrl(user, assignmentId, filename, filetype);
  }

  @Mutation(() => SubmissionType)
  async submitHomework(
    @Args('assignmentId') assignmentId: string,
    @Args('fileUrl') fileUrl: string,
    @Args('notes', { nullable: true }) notes: string,
    @Context() context: any,
  ) {
    const user = context.req.user;
    return this.assignmentsService.submitHomework(user, assignmentId, fileUrl, notes);
  }

  @Query(() => [StudentFeeBillType], { name: 'studentFees' })
  async getStudentFees(@Context() context: any) {
    const user = context.req.user;
    const profile = await getOrLoadStudentProfile(this.prisma, user);
    if (!profile) return [];

    return this.prisma.studentFeeBill.findMany({
      where: {
        studentId: profile.id,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  @Query(() => StudentPerformanceType, { name: 'studentPerformance' })
  async getStudentPerformance(@Context() context: any) {
    const user = context.req.user;
    const profile = await getOrLoadStudentProfile(this.prisma, user);
    if (!profile) {
      return { gpa: 0, rank: 'N/A', sectionName: 'N/A', subjects: [], examResults: [] };
    }

    const section = await this.prisma.section.findUnique({
      where: { id: profile.section_id || '' },
      include: { grade: true }
    });

    const sectionName = section ? `${section.grade?.name || ''} — ${section.name}` : 'N/A';

    const totalStudents = await this.prisma.students.count({
      where: { section_id: profile.section_id, deletedAt: null }
    });

    const higherRated = await this.prisma.students.count({
      where: {
        section_id: profile.section_id,
        users: {
          globalRating: {
            gt: profile.users?.globalRating || 0
          }
        },
        deletedAt: null
      }
    });

    const rank = `#${higherRated + 1} / ${totalStudents}`;

    const examResultsDb = await this.prisma.examResult.findMany({
      where: {
        studentId: profile.id,
        deletedAt: null
      },
      include: {
        examSchedule: {
          include: {
            exam: true,
            subject: true
          }
        }
      }
    });

    const subjectResults = new Map<string, { name: string; code: string; typeResults: Map<string, { sumPct: number, count: number }> }>();

    for (const res of examResultsDb) {
      const schedule = res.examSchedule;
      const sub = schedule.subject;
      if (!sub) continue;

      const subId = sub.id;
      const subName = sub.name || 'Subject';
      const subCode = sub.code || '';
      const examType = schedule.exam?.type || 'INTERNAL';

      const pct = schedule.maxMarks > 0 ? (res.obtainedMarks / schedule.maxMarks) * 100 : 0;

      if (!subjectResults.has(subId)) {
        subjectResults.set(subId, {
          name: subName,
          code: subCode,
          typeResults: new Map()
        });
      }

      const subData = subjectResults.get(subId)!;
      if (!subData.typeResults.has(examType)) {
        subData.typeResults.set(examType, { sumPct: 0, count: 0 });
      }
      const typeData = subData.typeResults.get(examType)!;
      typeData.sumPct += pct;
      typeData.count += 1;
    }

    const weights: Record<string, number> = {
      INTERNAL: 0.10,
      EXTERNAL: 0.30,
      BOARD: 0.60,
      COMPETITIVE: 0.10
    };

    let totalGpaSum = 0;
    let subjectCount = 0;

    const colors = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#c2410c', '#8b5cf6', '#ec4899'];
    let colorIdx = 0;

    const subjectsArray: any[] = [];
    subjectResults.forEach((data, subId) => {
      let weightedSum = 0;
      let weightSum = 0;

      data.typeResults.forEach((typeVal, typeKey) => {
        const typeAvg = typeVal.sumPct / typeVal.count;
        const weight = weights[typeKey] || 0.10;
        weightedSum += typeAvg * weight;
        weightSum += weight;
      });

      const finalScore = weightSum > 0 ? Math.round(weightedSum / weightSum) : 0;
      subjectsArray.push({
        subjectName: data.name,
        score: finalScore,
        color: colors[colorIdx % colors.length]
      });
      colorIdx++;

      totalGpaSum += finalScore;
      subjectCount++;
    });

    const gpa = subjectCount > 0 ? parseFloat(((totalGpaSum / subjectCount) / 10).toFixed(2)) : 0;

    const examResultsList = examResultsDb.map((res) => {
      const schedule = res.examSchedule;
      const examTitle = schedule.exam?.title || 'Exam';
      const subName = schedule.subject?.name || 'Subject';
      const maxMarks = schedule.maxMarks;
      const pct = maxMarks > 0 ? (res.obtainedMarks / maxMarks) * 100 : 0;

      let grade = 'F';
      let variant = 'red';
      if (pct >= 90) { grade = 'A+'; variant = 'green'; }
      else if (pct >= 80) { grade = 'A'; variant = 'green'; }
      else if (pct >= 70) { grade = 'B+'; variant = 'blue'; }
      else if (pct >= 60) { grade = 'B'; variant = 'blue'; }
      else if (pct >= 50) { grade = 'C'; variant = 'amber'; }
      else if (pct >= 33) { grade = 'D'; variant = 'amber'; }

      return {
        title: `${examTitle} — ${subName}`,
        date: schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '',
        score: `${res.obtainedMarks}/${maxMarks}`,
        grade,
        variant
      };
    });

    return {
      gpa,
      rank,
      sectionName,
      subjects: subjectsArray,
      examResults: examResultsList
    };
  }

  @ResolveField(() => String, { name: 'todayAttendance' })
  async getTodayAttendance(
    @Parent() student: any,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await this.prisma.attendance.findFirst({
      where: {
        users_id: student.users_id,
        date: today
      }
    });

    return todayAttendance?.status || 'NOT_MARKED';
  }
}

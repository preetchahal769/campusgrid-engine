import { Resolver, Query, Args, Context, Int, ResolveField, Parent } from '@nestjs/graphql';
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

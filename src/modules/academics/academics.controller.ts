import { Controller, Post, Body, UseGuards, Request, Get, Param, Patch } from '@nestjs/common';
import { GradesService } from './grades.service';
import { SectionsService } from './sections.service';
import { SubjectsService } from './subjects.service';
import { AssignmentsService } from './assignments.service';
import { TimetableService } from './timetable.service';
import { LeavesService } from './leaves.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { CreateBulkTimetableDto } from './dto/create-bulk-timetable.dto';
import { CreateLeaveRequestDto, UpdateLeaveStatusDto } from './dto/leave-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicsController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly sectionsService: SectionsService,
    private readonly subjectsService: SubjectsService,
    private readonly assignmentsService: AssignmentsService,
    private readonly timetableService: TimetableService,
    private readonly leavesService: LeavesService,
  ) {}

  @Post('grades')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  createGrade(@Body() createGradeDto: CreateGradeDto, @Request() req: any) {
    return this.gradesService.create(createGradeDto, req.user);
  }

  @Post('sections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  createSection(@Body() createSectionDto: CreateSectionDto, @Request() req: any) {
    return this.sectionsService.create(createSectionDto, req.user);
  }

  @Post('subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  createSubject(@Body() createSubjectDto: CreateSubjectDto, @Request() req: any) {
    return this.subjectsService.create(createSubjectDto, req.user);
  }

  @Post('assignments')
  @Roles(UserRole.TEACHER)
  createAssignment(@Body() createAssignmentDto: CreateAssignmentDto, @Request() req: any) {
    return this.assignmentsService.create(createAssignmentDto, req.user);
  }

  @Get('assignments')
  fetchAssignments(@Request() req: any) {
    return this.assignmentsService.fetchForUser(req.user);
  }

  @Get('assignments/allowed-contexts')
  @Roles(UserRole.TEACHER)
  getAllowedContexts(@Request() req: any) {
    return this.assignmentsService.getAllowedContexts(req.user);
  }

  @Post('assignments/:id/submit')
  @Roles(UserRole.STUDENT)
  submitAssignment(@Param('id') id: string, @Body() submissionDto: { content?: string, fileUrl?: string }, @Request() req: any) {
    return this.assignmentsService.submit(id, submissionDto, req.user);
  }

  @Post('submissions/:id/grade')
  @Roles(UserRole.TEACHER)
  gradeSubmission(@Param('id') id: string, @Body() gradeDto: { marks: number }, @Request() req: any) {
    return this.assignmentsService.grade(id, gradeDto.marks, req.user);
  }

  @Post('timetable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  createTimetable(@Body() body: CreateBulkTimetableDto, @Request() req: any) {
    return this.timetableService.createBulk(body, req.user);
  }

  @Get('timetable/section/:sectionId')
  fetchSectionTimetable(@Param('sectionId') sectionId: string) {
    return this.timetableService.fetchForSection(sectionId);
  }

  @Get('timetable/teacher/:teacherId')
  fetchTeacherTimetable(@Param('teacherId') teacherId: string) {
    return this.timetableService.fetchForTeacher(teacherId);
  }

  @Post('leaves')
  @Roles(UserRole.STUDENT)
  createLeave(@Body() createLeaveDto: CreateLeaveRequestDto, @Request() req: any) {
    return this.leavesService.create(createLeaveDto, req.user);
  }

  @Get('leaves')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  fetchLeaves(@Request() req: any) {
    return this.leavesService.findAll(req.user);
  }

  @Patch('leaves/:id/status')
  @Roles(UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateLeaveStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateLeaveStatusDto,
    @Request() req: any
  ) {
    return this.leavesService.updateStatus(id, updateDto, req.user);
  }

  @Post('leaves/:id/escalate')
  @Roles(UserRole.STUDENT)
  escalateLeave(@Param('id') id: string, @Request() req: any) {
    return this.leavesService.escalate(id, req.user);
  }

  @Patch('sections/:id/incharge')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  assignSectionIncharge(
    @Param('id') id: string,
    @Body() body: { teacherId: string },
    @Request() req: any
  ) {
    return this.sectionsService.assignIncharge(id, body.teacherId, req.user);
  }
}

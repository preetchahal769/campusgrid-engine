import { Controller, Post, Body, UseGuards, Request, Get, Param, Patch, UseInterceptors, UploadedFiles, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GradesService } from './grades.service';
import { SectionsService } from './sections.service';
import { SubjectsService } from './subjects.service';
import { AssignmentsService } from './assignments.service';
import { TimetableService } from './timetable.service';
import { LeavesService } from './leaves.service';
import { SubstitutionsService } from './substitutions.service';
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
import { ExamsService } from './exams.service';
import { CalendarService } from './calendar.service';
import { CreateExamDto, CreateExamScheduleDto, BulkResultSubmitDto } from './dto/exam.dto';
import { CreateTermDto, CreateEventDto } from './dto/calendar.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

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
    private readonly substitutionsService: SubstitutionsService,
    private readonly examsService: ExamsService,
    private readonly calendarService: CalendarService,
  ) {}

  @Post('grades')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  createGrade(@Body() createGradeDto: CreateGradeDto, @Request() req: AuthenticatedRequest) {
    return this.gradesService.create(createGradeDto, req.user);
  }

  @Get('grades')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  fetchGrades(@Request() req: AuthenticatedRequest) {
    return this.gradesService.findAll(req.user);
  }

  @Post('sections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  createSection(@Body() createSectionDto: CreateSectionDto, @Request() req: AuthenticatedRequest) {
    return this.sectionsService.create(createSectionDto, req.user);
  }

  @Get('sections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  fetchSections(@Request() req: AuthenticatedRequest) {
    return this.sectionsService.findAll(req.user);
  }

  @Post('subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  createSubject(@Body() createSubjectDto: CreateSubjectDto, @Request() req: AuthenticatedRequest) {
    return this.subjectsService.create(createSubjectDto, req.user);
  }

  @Get('subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  fetchSubjects(@Request() req: AuthenticatedRequest) {
    return this.subjectsService.findAll(req.user);
  }

  @Post('assignments')
  @Roles(UserRole.TEACHER)
  @UseInterceptors(FilesInterceptor('files'))
  createAssignment(
    @Body() createAssignmentDto: CreateAssignmentDto, 
    @Request() req: AuthenticatedRequest,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.assignmentsService.create(createAssignmentDto, req.user, files);
  }

  @Get('assignments')
  fetchAssignments(@Request() req: AuthenticatedRequest) {
    return this.assignmentsService.fetchForUser(req.user);
  }

  @Get('assignments/allowed-contexts')
  @Roles(UserRole.TEACHER)
  getAllowedContexts(@Request() req: AuthenticatedRequest) {
    return this.assignmentsService.getAllowedContexts(req.user);
  }

  @Post('assignments/:id/submit')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FilesInterceptor('files'))
  submitAssignment(
    @Param('id') id: string, 
    @Body() submissionDto: { content?: string }, 
    @Request() req: AuthenticatedRequest,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.assignmentsService.submit(id, submissionDto, req.user, files);
  }

  @Get('assignments/:id')
  fetchAssignmentDetail(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.assignmentsService.findById(id, req.user);
  }

  @Get('assignments/:id/submissions')
  @Roles(UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ADMIN)
  fetchAssignmentSubmissions(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.assignmentsService.fetchSubmissions(id, req.user);
  }

  @Post('submissions/:id/grade')
  @Roles(UserRole.TEACHER)
  gradeSubmission(@Param('id') id: string, @Body() gradeDto: { marks: number }, @Request() req: AuthenticatedRequest) {
    return this.assignmentsService.grade(id, gradeDto.marks, req.user);
  }

  @Post('timetable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  createTimetable(@Body() body: CreateBulkTimetableDto, @Request() req: AuthenticatedRequest) {
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

  @Patch('timetable/:id/studio')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  updateStudioAssignment(@Param('id') id: string, @Body() body: { studioRoomId: string | null }) {
    return this.timetableService.updateStudioAssignment(id, body.studioRoomId);
  }

  @Post('leaves')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  createLeave(@Body() createLeaveDto: CreateLeaveRequestDto, @Request() req: AuthenticatedRequest) {
    return this.leavesService.create(createLeaveDto, req.user);
  }

  @Get('leaves')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  fetchLeaves(@Request() req: AuthenticatedRequest) {
    return this.leavesService.findAll(req.user);
  }

  @Patch('leaves/:id/status')
  @Roles(UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateLeaveStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateLeaveStatusDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.leavesService.updateStatus(id, updateDto, req.user);
  }

  @Post('leaves/:id/escalate')
  @Roles(UserRole.STUDENT)
  escalateLeave(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.leavesService.escalate(id, req.user);
  }

  @Patch('sections/:id/incharge')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  assignSectionIncharge(
    @Param('id') id: string,
    @Body() body: { teacherId: string },
    @Request() req: AuthenticatedRequest
  ) {
    return this.sectionsService.assignIncharge(id, body.teacherId, req.user);
  }

  @Get('sections/my-class/students')
  @Roles(UserRole.TEACHER)
  fetchMyClassStudents(@Request() req: AuthenticatedRequest) {
    return this.sectionsService.findMyClassStudents(req.user);
  }

  // --- Substitutions & Replacements ---

  @Get('substitutions/absent-teachers')
  @Roles(UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  fetchAbsentTeachers(@Request() req: AuthenticatedRequest) {
    return this.substitutionsService.findAbsentTeachers(req.user);
  }

  @Get('substitutions/available-teachers')
  @Roles(UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  fetchAvailableTeachers(
    @Query('lectureNo') lectureNo: string,
    @Query('dayOfWeek') dayOfWeek: string,
    @Query('subjectId') subjectId: string,
    @Query('sectionId') sectionId: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.substitutionsService.findAvailableTeachers(
      parseInt(lectureNo),
      dayOfWeek,
      req.user,
      subjectId,
      sectionId
    );
  }

  @Post('substitutions/assign')
  @Roles(UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  assignReplacement(@Body() body: any, @Request() req: AuthenticatedRequest) {
    return this.substitutionsService.assignReplacement(body, req.user);
  }

  @Get('substitutions/active')
  fetchActiveSubstitutions(@Request() req: AuthenticatedRequest) {
    return this.substitutionsService.getActiveSubstitutions(req.user);
  }

  // --- Exams & Results ---

  @Post('exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  createExam(@Body() dto: CreateExamDto) {
    return this.examsService.createExam(dto);
  }

  @Get('exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  fetchExams(@Query('schoolId') schoolId: string) {
    return this.examsService.findAllExams(schoolId);
  }

  @Post('exams/schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  scheduleExam(@Body() dto: CreateExamScheduleDto) {
    return this.examsService.scheduleExam(dto);
  }

  @Get('exams/my-schedules')
  @Roles(UserRole.TEACHER)
  fetchMySchedules(@Request() req: AuthenticatedRequest) {
    return this.examsService.findTeacherSchedules(req.user);
  }

  @Get('exams/:id/schedules')
  fetchExamSchedules(@Param('id') id: string) {
    return this.examsService.getSchedulesByExam(id);
  }

  @Post('exams/results')
  @Roles(UserRole.TEACHER, UserRole.PRINCIPAL)
  submitResults(@Body() dto: BulkResultSubmitDto) {
    return this.examsService.submitResults(dto);
  }

  @Get('exams/schedules/:scheduleId/results')
  @Roles(UserRole.TEACHER, UserRole.PRINCIPAL)
  fetchScheduleResults(@Param('scheduleId') scheduleId: string) {
    return this.examsService.getScheduleResults(scheduleId);
  }

  @Get('exams/:examId/report-card/:studentId')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.PRINCIPAL)
  getReportCard(@Param('examId') examId: string, @Param('studentId') studentId: string) {
    return this.examsService.getStudentReport(studentId, examId);
  }

  @Get('exams/:examId/report-card/:studentId/pdf')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.PRINCIPAL)
  async getReportCardPdf(
    @Param('examId') examId: string,
    @Param('studentId') studentId: string,
    @Res() res: Response
  ) {
    const buffer = await this.examsService.generateReportCardPdf(studentId, examId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=report_card_${studentId}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // --- Calendar: Terms & Events ---

  @Post('terms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  createTerm(@Body() dto: CreateTermDto) {
    return this.calendarService.createTerm(dto);
  }

  @Get('terms')
  fetchTerms(@Query('schoolId') schoolId: string) {
    return this.calendarService.findAllTerms(schoolId);
  }

  @Post('events')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  createEvent(@Body() dto: CreateEventDto) {
    return this.calendarService.createEvent(dto);
  }

  @Get('events')
  fetchEvents(
    @Query('schoolId') schoolId: string,
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    return this.calendarService.findAllEvents(
      schoolId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );
  }
}

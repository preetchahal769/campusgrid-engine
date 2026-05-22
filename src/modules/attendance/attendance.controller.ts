import { Controller, Post, Body, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, AttendanceStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  markAttendance(@Body() createAttendanceDto: CreateAttendanceDto, @Request() req: AuthenticatedRequest) {
    return this.attendanceService.markAttendance(createAttendanceDto, req.user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  fetchAttendance(
    @Query('date') date: string,
    @Query('users_id') users_id: string,
    @Query('section_id') section_id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.attendanceService.fetchAttendance({ date, users_id, section_id }, req.user);
  }

  @Post('class/:sectionId')
  @Roles(UserRole.TEACHER)
  async markClassAttendance(
    @Param('sectionId') sectionId: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Request() req: AuthenticatedRequest
  ) {
    await this.attendanceService.validateIncharge(sectionId, req.user);
    return this.attendanceService.markAttendance(createAttendanceDto, req.user);
  }

  @Get('me')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT, UserRole.PRINCIPAL)
  fetchMyAttendance(
    @Query('month') month: string,
    @Query('year') year: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.attendanceService.fetchMyAttendance(
      req.user, 
      month ? parseInt(month) : undefined, 
      year ? parseInt(year) : undefined
    );
  }

  @Post('me')
  @Roles(UserRole.TEACHER, UserRole.STAFF, UserRole.PRINCIPAL, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  markSelfAttendance(@Body() body: { status: AttendanceStatus }, @Request() req: AuthenticatedRequest) {
    return this.attendanceService.markSelfAttendance(req.user, body.status);
  }
}

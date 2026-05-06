import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  markAttendance(@Body() createAttendanceDto: CreateAttendanceDto, @Request() req: any) {
    return this.attendanceService.markAttendance(createAttendanceDto, req.user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  fetchAttendance(
    @Query('date') date: string,
    @Query('users_id') users_id: string,
    @Request() req: any
  ) {
    return this.attendanceService.fetchAttendance(date, users_id, req.user);
  }
}

import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post('profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  createProfile(@Body() createTeacherProfileDto: CreateTeacherProfileDto, @Request() req: any) {
    return this.teachersService.createProfile(createTeacherProfileDto, req.user);
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  assignSubjectAndSection(@Body() assignTeacherDto: AssignTeacherDto, @Request() req: any) {
    return this.teachersService.assignSubjectAndSection(assignTeacherDto, req.user);
  }

  @Get('me')
  @Roles(UserRole.TEACHER)
  fetchMyProfile(@Request() req: any) {
    return this.teachersService.findMyProfile(req.user);
  }
}

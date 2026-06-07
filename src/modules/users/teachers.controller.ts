import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post('profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  createProfile(@Body() createTeacherProfileDto: CreateTeacherProfileDto, @Request() req: AuthenticatedRequest) {
    return this.teachersService.createProfile(createTeacherProfileDto, req.user);
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  assignSubjectAndSection(@Body() assignTeacherDto: AssignTeacherDto, @Request() req: AuthenticatedRequest) {
    return this.teachersService.assignSubjectAndSection(assignTeacherDto, req.user);
  }

  @Get('me')
  @Roles(UserRole.TEACHER)
  fetchMyProfile(@Request() req: AuthenticatedRequest) {
    return this.teachersService.findMyProfile(req.user);
  }

  @Patch('profile')
  @Roles(UserRole.TEACHER)
  updateProfile(@Body() updateDto: any, @Request() req: AuthenticatedRequest) {
    return this.teachersService.updateProfile(req.user, updateDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.teachersService.findAll(req.user);
  }
}

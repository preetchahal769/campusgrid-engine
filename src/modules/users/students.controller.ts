import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { BulkUpdateSectionDto } from './dto/bulk-update-section.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  createProfile(@Body() createStudentProfileDto: CreateStudentProfileDto, @Request() req: AuthenticatedRequest) {
    return this.studentsService.createProfile(createStudentProfileDto, req.user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.studentsService.findAll(req.user);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  findMyProfile(@Request() req: AuthenticatedRequest) {
    return this.studentsService.findMyProfile(req.user);
  }

  @Patch('bulk/section')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  updateBulkSection(@Body() bulkDto: BulkUpdateSectionDto, @Request() req: AuthenticatedRequest) {
    return this.studentsService.updateBulkSection(bulkDto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  updateProfile(
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentProfileDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.studentsService.updateProfile(id, updateDto, req.user);
  }
}

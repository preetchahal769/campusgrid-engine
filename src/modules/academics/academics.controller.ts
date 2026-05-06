import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GradesService } from './grades.service';
import { SectionsService } from './sections.service';
import { SubjectsService } from './subjects.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
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
}

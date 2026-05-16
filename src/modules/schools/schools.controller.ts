import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete, Query } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto, CreateSchoolWithPrincipalDto } from './dto/create-school.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolSubscriptionsService } from '../finance/school-subscriptions.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolsController {
  constructor(
    private readonly schoolsService: SchoolsService,
    private readonly financeService: SchoolSubscriptionsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createSchoolDto: CreateSchoolDto, @Request() req: any) {
    return this.schoolsService.create(createSchoolDto, req.user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Get(':id/users')
  @Roles(UserRole.SUPER_ADMIN)
  findUsers(@Param('id') id: string, @Query('role') role?: UserRole) {
    return this.schoolsService.findUsers(id, role);
  }

  @Get(':id/finance')
  @Roles(UserRole.SUPER_ADMIN)
  getFinance(@Param('id') id: string) {
    return this.financeService.getSchoolFinance(id);
  }

  @Get(':id/analytics')
  @Roles(UserRole.SUPER_ADMIN)
  getAnalytics(@Param('id') id: string) {
    return this.analyticsService.getNodeAnalytics(id);
  }

  @Post('with-principal')
  @Roles(UserRole.SUPER_ADMIN)
  createWithPrincipal(@Body() dto: CreateSchoolWithPrincipalDto) {
    return this.schoolsService.createWithPrincipal(dto);
  }

  @Post(':id/assign-principal')
  @Roles(UserRole.SUPER_ADMIN)
  assignPrincipal(
    @Param('id') id: string,
    @Body() body: { userId: string, qualification?: string, experienceYears?: number }
  ) {
    return this.schoolsService.assignPrincipal(id, body.userId, body);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'INACTIVE' | 'DELETED' },
    @Request() req: any
  ) {
    return this.schoolsService.update(id, { status: body.status }, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.schoolsService.update(id, body, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.schoolsService.remove(id, req.user);
  }
}

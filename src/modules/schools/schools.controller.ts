import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto, CreateSchoolWithPrincipalDto } from './dto/create-school.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

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

  @Post('with-principal')
  @Roles(UserRole.SUPER_ADMIN)
  createWithPrincipal(@Body() dto: CreateSchoolWithPrincipalDto) {
    return this.schoolsService.createWithPrincipal(dto);
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

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { StudiosService } from './studios.service';
import { CreateStudioRoomDto, UpdateStudioRoomDto, DistributionConfigDto } from './dto/studio-room.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('studios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createStudioRoomDto: CreateStudioRoomDto) {
    return this.studiosService.create(createStudioRoomDto);
  }

  @Get()
  findAll(@Query('schoolId') schoolId: string) {
    return this.studiosService.findAll(schoolId);
  }

  @Get('calculate-needed')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PRINCIPAL)
  calculate(@Query('schoolId') schoolId: string, @Query('lecturesPerWeek') lecturesPerWeek?: string) {
    return this.studiosService.calculateRequiredRooms(schoolId, lecturesPerWeek ? parseInt(lecturesPerWeek) : 2);
  }

  @Post('distribute')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  distribute(@Body() config: DistributionConfigDto, @Query('schoolId') schoolId: string) {
    return this.studiosService.distributeStudioRooms(schoolId, config.lecturesPerClassPerWeek);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studiosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateStudioRoomDto: UpdateStudioRoomDto) {
    return this.studiosService.update(id, updateStudioRoomDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.studiosService.remove(id);
  }
}

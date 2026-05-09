import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors, UploadedFiles, Param } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('communications/broadcasts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createBroadcastDto: CreateBroadcastDto, 
    @Request() req: any,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return this.broadcastsService.create(createBroadcastDto, req.user, files);
  }

  @Get()
  fetchForUser(@Request() req: any) {
    return this.broadcastsService.fetchForUser(req.user);
  }

  @Get('target-roles')
  getTargetRoles(@Request() req: any) {
    return this.broadcastsService.getTargetRoles(req.user);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() req: any) {
    return this.broadcastsService.findById(id, req.user);
  }
}

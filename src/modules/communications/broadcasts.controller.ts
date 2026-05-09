import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('broadcast')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createBroadcastDto: CreateBroadcastDto, 
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.broadcastsService.create(createBroadcastDto, req.user, file);
  }

  @Get()
  fetchForUser(@Request() req: any) {
    return this.broadcastsService.fetchForUser(req.user);
  }

  @Get('target-roles')
  getTargetRoles(@Request() req: any) {
    return this.broadcastsService.getTargetRoles(req.user);
  }
}

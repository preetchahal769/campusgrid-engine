import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { StudioRequestsService } from './studio-requests.service';
import { CreateSwapRequestDto, RespondSwapRequestDto } from './dto/swap-request.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('studios/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudioRequestsController {
  constructor(private readonly requestsService: StudioRequestsService) {}

  @Post('swap')
  @Roles(UserRole.TEACHER)
  create(@Body() createDto: CreateSwapRequestDto, @Req() req: AuthenticatedRequest) {
    return this.requestsService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.TEACHER)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.requestsService.findAllForTeacher(req.user.id);
  }

  @Patch(':id/respond')
  @Roles(UserRole.TEACHER)
  respond(@Param('id') id: string, @Body() respondDto: RespondSwapRequestDto, @Req() req: AuthenticatedRequest) {
    return this.requestsService.respond(id, respondDto, req.user.id);
  }
}

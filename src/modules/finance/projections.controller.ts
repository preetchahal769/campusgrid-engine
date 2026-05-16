import { Controller, Get, UseGuards } from '@nestjs/common';
import { SchoolSubscriptionsService } from './school-subscriptions.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceProjectionsController {
  constructor(private readonly subService: SchoolSubscriptionsService) {}

  @Get('current-mrr')
  @Roles(UserRole.SUPER_ADMIN)
  getMrr() {
    return this.subService.getMrrProjections();
  }
}

import { Controller, Post, Body, Get, Query, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { SchoolSubscriptionsService } from './school-subscriptions.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('finance/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolSubscriptionsController {
  constructor(private readonly subService: SchoolSubscriptionsService) {}

  @Post('process-monthly')
  @Roles(UserRole.SUPER_ADMIN)
  processMonthly(@Body() body: { month: string }, @Request() req: AuthenticatedRequest) {
    return this.subService.generateMonthlyBills(body.month, req.user);
  }

  @Post('generate')
  @Roles(UserRole.SUPER_ADMIN)
  generateBills(@Body() body: { month: string }, @Request() req: AuthenticatedRequest) {
    return this.subService.generateMonthlyBills(body.month, req.user);
  }

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN)
  getOverview() {
    return this.subService.getOverview();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(
    @Query('schoolId') schoolId?: string,
    @Query('status') status?: SubscriptionStatus,
  ) {
    return this.subService.findAll({ schoolId, status });
  }

  @Patch(':id/pay')
  @Roles(UserRole.SUPER_ADMIN)
  markAsPaid(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.subService.markAsPaid(id, body.amount, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.subService.update(id, body, req.user);
  }

  @Get('my-bills')
  @Roles(UserRole.PRINCIPAL, UserRole.ADMIN)
  getMyBills(@Request() req: AuthenticatedRequest) {
    return this.subService.findAll({ schoolId: req.user.School_id });
  }
}

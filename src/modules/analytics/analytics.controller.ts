import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('global-dashboard')
  @Roles(UserRole.SUPER_ADMIN)
  getGlobalDashboard() {
    return this.analyticsService.getGlobalDashboard();
  }

  @Get('live-sessions')
  @Roles(UserRole.SUPER_ADMIN)
  getLiveSessions() {
    return this.analyticsService.getLiveSessions();
  }

  @Get('api-traffic')
  @Roles(UserRole.SUPER_ADMIN)
  getApiTraffic() {
    return this.analyticsService.getApiTraffic();
  }
}

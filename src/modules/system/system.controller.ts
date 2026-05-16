import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @Roles(UserRole.SUPER_ADMIN)
  getHealth() {
    return this.systemService.getHealth();
  }
}

@Controller('infrastructure')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InfrastructureController {
  constructor(private readonly systemService: SystemService) {}

  @Get('storage')
  @Roles(UserRole.SUPER_ADMIN)
  getStorage() {
    return this.systemService.getStorageUsage();
  }
}

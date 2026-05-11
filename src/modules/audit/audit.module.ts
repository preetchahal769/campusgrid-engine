import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query('module') module?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.findAll({
      module,
      userId,
      action,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }
}

// --- Module ---
import { Module } from '@nestjs/common';

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

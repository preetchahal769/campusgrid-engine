import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('escalations/urgent')
  @Roles(UserRole.SUPER_ADMIN)
  getUrgent() {
    return this.supportService.getUrgentEscalations();
  }

  @Patch('escalations/:id/acknowledge')
  @Roles(UserRole.SUPER_ADMIN)
  acknowledge(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.supportService.acknowledgeEscalation(id, req.user.id);
  }
}

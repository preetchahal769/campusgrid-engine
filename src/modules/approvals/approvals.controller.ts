import { Controller, Get, Post, Param, UseGuards, Request, Body } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { HandleApprovalDto } from './dto/approval.dto';

@Controller('approvals/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.approvalsService.findAllPending(req.user);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  approve(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.approvalsService.approveRequest(id, req.user);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  reject(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.approvalsService.rejectRequest(id, req.user);
  }

  @Get('tasks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  findPendingTasks(@Request() req: AuthenticatedRequest) {
    return this.approvalsService.findAllPendingTasks(req.user);
  }

  @Post('tasks/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL)
  handleTask(
    @Param('id') id: string,
    @Body() dto: HandleApprovalDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.approvalsService.handleApprovalTask(id, dto.status, req.user);
  }
}

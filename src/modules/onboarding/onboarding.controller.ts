import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateStagedOnboardingBatchDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.BURSAR)
  create(@Body() dto: CreateStagedOnboardingBatchDto, @Request() req: AuthenticatedRequest) {
    return this.onboardingService.createStagedBatch(dto, req.user);
  }

  @Get('batches')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.BURSAR, UserRole.PRINCIPAL)
  findAll(@Request() req: AuthenticatedRequest) {
    const schoolId = req.user.School_id;
    if (!schoolId) {
      throw new Error('User must belong to a school.');
    }
    return this.onboardingService.findStagedBatches(schoolId);
  }

  @Get('batches/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.BURSAR, UserRole.PRINCIPAL)
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const schoolId = req.user.School_id;
    if (!schoolId) {
      throw new Error('User must belong to a school.');
    }
    return this.onboardingService.getBatchDetails(id, schoolId);
  }

  @Get('dispatches')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.BURSAR, UserRole.PRINCIPAL)
  findDispatches(@Request() req: AuthenticatedRequest) {
    const schoolId = req.user.School_id;
    if (!schoolId) {
      throw new Error('User must belong to a school.');
    }
    return this.onboardingService.findDispatches(schoolId);
  }
}

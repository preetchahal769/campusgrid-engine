import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { PrincipalsService } from './principals.service';
import { CreatePrincipalProfileDto } from './dto/create-principal-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('principals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrincipalsController {
  constructor(private readonly principalsService: PrincipalsService) {}

  @Post('profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  createProfile(@Body() createPrincipalProfileDto: CreatePrincipalProfileDto, @Request() req: AuthenticatedRequest) {
    return this.principalsService.createProfile(createPrincipalProfileDto, req.user);
  }

  @Get('me')
  @Roles(UserRole.PRINCIPAL)
  findMyProfile(@Request() req: AuthenticatedRequest) {
    return this.principalsService.findMyProfile(req.user);
  }
}

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { RouteService } from './route.service';
import { ParentSubmitDto, DriverAssignDto } from './dto/route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('route')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post('parent-submit')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.PARENT)
  parentSubmit(@Body() dto: ParentSubmitDto, @Request() req: AuthenticatedRequest) {
    return this.routeService.parentSubmit(dto, req.user);
  }

  @Post('driver-assign')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.TRANSPORT_MANAGER)
  driverAssign(@Body() dto: DriverAssignDto, @Request() req: AuthenticatedRequest) {
    return this.routeService.driverAssign(dto, req.user);
  }
}

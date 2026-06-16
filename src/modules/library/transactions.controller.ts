import { Controller, Post, Patch, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CheckoutBookDto } from './dto/library.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('library')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('checkout')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.LIBRARIAN)
  checkout(@Body() dto: CheckoutBookDto, @Request() req: AuthenticatedRequest) {
    return this.transactionsService.checkoutBook(dto, req.user);
  }

  @Patch('transactions/:id/return')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.LIBRARIAN)
  returnBook(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.transactionsService.returnBook(id, req.user);
  }

  @Get('transactions')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.LIBRARIAN)
  findAll(@Request() req: AuthenticatedRequest) {
    const schoolId = req.user.School_id;
    if (!schoolId) {
      throw new Error('User must belong to a school.');
    }
    return this.transactionsService.findTransactions(schoolId);
  }
}

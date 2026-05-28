import { Controller, Post, Body, Get, Query, UseGuards, Request, Param, Patch, StreamableFile, Res, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from '../storage/pdf.service';
import { PrismaService } from '../../database/prisma.service';
import { PayrollService } from './payroll.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SetSalaryStructureDto, GeneratePayrollDto } from './dto/payroll.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('finance/payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('structure')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.SUPER_ADMIN)
  setStructure(@Body() dto: SetSalaryStructureDto, @Request() req: AuthenticatedRequest) {
    return this.payrollService.setSalaryStructure(dto, req.user);
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  generatePayroll(@Body() dto: GeneratePayrollDto, @Request() req: AuthenticatedRequest) {
    return this.payrollService.generateMonthlyPayroll(dto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  findAll(@Query('month') month: string, @Request() req: AuthenticatedRequest) {
    if (!req.user.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }
    return this.payrollService.findAll(req.user.School_id, month);
  }

  @Patch(':id/pay')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  markPaid(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.payrollService.markAsPaid(id, req.user);
  }

  @Get('my-slips')
  getMySlips(@Request() req: AuthenticatedRequest) {
    return this.payrollService.findMyPayroll(req.user.id);
  }

  @Get(':id/slip')
  async downloadSlip(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, School_id: true, role: true } }
      }
    });

    if (!payroll || !payroll.paidAt) throw new Error('Payroll record not found or not paid');

    const school = await this.prisma.school.findUnique({ where: { id: payroll.user.School_id! } });

    const pdf = await this.pdfService.generateSalarySlip({
      schoolName: school?.name || 'CampusGrid School',
      staffName: payroll.user.name || 'Employee',
      role: payroll.user.role,
      month: payroll.month,
      base: payroll.baseSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      net: payroll.netSalary,
      paidAt: payroll.paidAt.toLocaleDateString(),
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="salary_slip_${id}.pdf"`,
    });

    return new StreamableFile(pdf);
  }
}

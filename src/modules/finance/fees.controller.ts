import { Controller, Post, Body, Get, Query, UseGuards, Request, Param, Patch, StreamableFile, Res } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from '../storage/pdf.service';
import { PrismaService } from '../../database/prisma.service';
import { FeesService } from './fees.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateFeeStructureDto, GenerateFeeBillsDto } from './dto/fee.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('finance/fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(
    private readonly feesService: FeesService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('structure')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  setStructure(@Body() dto: CreateFeeStructureDto, @Request() req: AuthenticatedRequest) {
    return this.feesService.setFeeStructure(dto, req.user);
  }

  @Post('generate-bills')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  generateBills(@Body() dto: GenerateFeeBillsDto, @Request() req: AuthenticatedRequest) {
    return this.feesService.generateBills(dto, req.user);
  }

  @Patch('bills/:id/pay')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.STAFF)
  markPaid(@Param('id') id: string, @Body() body: { amount: number }, @Request() req: AuthenticatedRequest) {
    return this.feesService.markAsPaid(id, body.amount, req.user);
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.PRINCIPAL)
  getStudentBills(@Param('studentId') studentId: string) {
    return this.feesService.getStudentBills(studentId);
  }

  @Get('bills/:id/receipt')
  async downloadReceipt(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const bill = await this.prisma.studentFeeBill.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            users: { select: { name: true, School_id: true } },
            section: { select: { name: true } }
          }
        }
      }
    });

    if (!bill || !bill.paidAt) throw new Error('Bill not found or not paid');

    const school = await this.prisma.school.findUnique({ where: { id: bill.student.users.School_id! } });

    const html = this.pdfService.getFeeReceiptTemplate({
      schoolName: school?.name || 'CampusGrid School',
      studentName: bill.student.users.name || 'Student',
      rollNo: bill.student.rollNumber?.toString() || 'N/A',
      billId: bill.id,
      month: bill.month,
      amount: bill.amountPaid,
      paidAt: bill.paidAt.toLocaleDateString(),
    });

    const pdf = await this.pdfService.generatePdf(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt_${id}.pdf"`,
    });

    return new StreamableFile(pdf);
  }
}

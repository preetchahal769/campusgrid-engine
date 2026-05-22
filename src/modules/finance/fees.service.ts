import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFeeStructureDto, GenerateFeeBillsDto } from './dto/fee.dto';
import { SubscriptionStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class FeesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async setFeeStructure(dto: CreateFeeStructureDto, currentUser: AuthenticatedUser) {
    const structure = await this.prisma.feeStructure.upsert({
      where: {
        gradeId_name: {
          gradeId: dto.gradeId,
          name: dto.name,
        }
      },
      update: {
        amount: dto.amount,
        frequency: dto.frequency,
      },
      create: dto,
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'SET_FEE_STRUCTURE',
      module: 'FINANCE',
      entityId: structure.id,
      details: dto
    });

    return structure;
  }

  async generateBills(dto: GenerateFeeBillsDto, currentUser: AuthenticatedUser) {
    const { month, gradeId } = dto;

    // 1. Get all students in this grade
    const students = await this.prisma.students.findMany({
      where: { 
        section: { grade_id: gradeId },
        users: { School_id: currentUser.School_id }
      },
      select: { id: true }
    });

    // 2. Get fee structure for this grade
    const structures = await this.prisma.feeStructure.findMany({
      where: { gradeId }
    });

    const totalDue = structures.reduce((sum, s) => sum + s.amount, 0);
    const results: any[] = [];

    for (const student of students) {
      const bill = await this.prisma.studentFeeBill.upsert({
        where: {
          id: `${student.id}-${month}` // Simple unique key for this logic
        },
        update: {
          amountDue: totalDue
        },
        create: {
          id: `${student.id}-${month}`,
          studentId: student.id,
          month,
          amountDue: totalDue,
          status: SubscriptionStatus.PENDING,
        }
      });
      results.push(bill);
    }

    await this.auditService.log({
      userId: currentUser.id,
      action: 'GENERATE_STUDENT_BILLS',
      module: 'FINANCE',
      details: { month, gradeId, count: results.length }
    });

    return results;
  }

  async markAsPaid(billId: string, amount: number, currentUser: AuthenticatedUser) {
    const bill = await this.prisma.studentFeeBill.update({
      where: { id: billId },
      data: {
        amountPaid: amount,
        status: SubscriptionStatus.PAID,
        paidAt: new Date(),
      }
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'STUDENT_FEE_PAID',
      module: 'FINANCE',
      entityId: billId,
      details: { amount, studentId: bill.studentId }
    });

    return bill;
  }

  async getStudentBills(studentId: string) {
    return this.prisma.studentFeeBill.findMany({
      where: { studentId },
      orderBy: { month: 'desc' }
    });
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SetSalaryStructureDto, GeneratePayrollDto } from './dto/payroll.dto';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async setSalaryStructure(dto: SetSalaryStructureDto, currentUser: any) {
    const targetUser = await this.prisma.users.findUnique({ where: { id: dto.userId } });
    if (!targetUser) throw new NotFoundException('Staff/Teacher not found');
    
    // Security: Ensure the user belongs to the same school
    if (currentUser.role !== UserRole.SUPER_ADMIN && targetUser.School_id !== currentUser.School_id) {
      throw new ConflictException('You can only set salary for users in your school.');
    }

    const structure = await this.prisma.salaryStructure.upsert({
      where: { userId: dto.userId },
      update: {
        baseSalary: dto.baseSalary,
        allowances: dto.allowances || 0,
        deductions: dto.deductions || 0,
      },
      create: {
        userId: dto.userId,
        baseSalary: dto.baseSalary,
        allowances: dto.allowances || 0,
        deductions: dto.deductions || 0,
      }
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'SET_SALARY_STRUCTURE',
      module: 'FINANCE',
      entityId: structure.id,
      details: { targetUserId: dto.userId, ...dto }
    });

    return structure;
  }

  async generateMonthlyPayroll(dto: GeneratePayrollDto, currentUser: any) {
    const { month } = dto;
    const schoolId = currentUser.School_id;

    // 1. Get all users in the school who have a salary structure defined
    const staffWithStructure = await this.prisma.users.findMany({
      where: {
        School_id: schoolId,
        role: { in: [UserRole.TEACHER, UserRole.STAFF, UserRole.PRINCIPAL, UserRole.MANAGEMENT, UserRole.ADMIN] },
        salaryStructure: { isNot: null }
      },
      include: { salaryStructure: true }
    });

    const results: any[] = [];

    for (const staff of staffWithStructure) {
      const structure = staff.salaryStructure!;
      const netSalary = structure.baseSalary + structure.allowances - structure.deductions;

      const payroll = await this.prisma.payroll.upsert({
        where: {
          userId_month: {
            userId: staff.id,
            month: month,
          }
        },
        update: {
          baseSalary: structure.baseSalary,
          allowances: structure.allowances,
          deductions: structure.deductions,
          netSalary,
        },
        create: {
          userId: staff.id,
          month,
          baseSalary: structure.baseSalary,
          allowances: structure.allowances,
          deductions: structure.deductions,
          netSalary,
          status: SubscriptionStatus.PENDING,
        }
      });
      results.push(payroll);
    }

    await this.auditService.log({
      userId: currentUser.id,
      action: 'GENERATE_PAYROLL',
      module: 'FINANCE',
      details: { month, count: results.length }
    });

    return results;
  }

  async markAsPaid(payrollId: string, currentUser: any) {
    const payroll = await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: SubscriptionStatus.PAID,
        paidAt: new Date(),
      }
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'PAYROLL_PAID',
      module: 'FINANCE',
      entityId: payrollId,
      details: { targetUserId: payroll.userId, amount: payroll.netSalary }
    });

    return payroll;
  }

  async findMyPayroll(userId: string) {
    return this.prisma.payroll.findMany({
      where: { userId },
      orderBy: { month: 'desc' }
    });
  }

  async findAll(schoolId: string, month?: string) {
    return this.prisma.payroll.findMany({
      where: {
        user: { School_id: schoolId },
        month: month
      },
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { month: 'desc' }
    });
  }
}

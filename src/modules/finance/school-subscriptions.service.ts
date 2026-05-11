import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SchoolSubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Automatically generate bills on the 1st of every month.
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleAutoMonthlyBilling() {
    const month = new Date().toISOString().substring(0, 7); // YYYY-MM
    console.log(`[Cron] Auto-generating bills for ${month}`);
    // System user ID or a placeholder for system actions
    await this.generateMonthlyBills(month, { id: 'SYSTEM', role: 'SYSTEM' });
  }

  /**
   * Generates bills for all schools for a specific month.
   * Logic: Count students * 80 RS.
   */
  async generateMonthlyBills(month?: string, currentUser?: any) {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    
    const schools = await this.prisma.school.findMany({
      where: { status: 'ACTIVE' },
      select: { 
        id: true, 
        subscriptionRate: true,
        _count: { select: { users: { where: { role: 'STUDENT' } } } } 
      } as any
    });

    const results: any[] = [];

    for (const school of schools) {
      const studentCount = (school as any)._count.users;
      const rate = (school as any).subscriptionRate || 80;
      const amountDue = studentCount * rate;

      // Use upsert to avoid duplicates for the same month
      const subscription = await this.prisma.schoolSubscription.upsert({
        where: {
          schoolId_month: {
            schoolId: school.id,
            month: targetMonth,
          }
        },
        update: {
          studentCount,
          amountDue,
          ratePerStudent: rate,
        },
        create: {
          schoolId: school.id,
          month: targetMonth,
          studentCount,
          amountDue,
          ratePerStudent: rate,
          status: SubscriptionStatus.PENDING,
        }
      });
      results.push(subscription);
    }

    await this.auditService.log({
      userId: currentUser.id,
      action: 'GENERATE_BILLS',
      module: 'FINANCE',
      details: { month, count: results.length }
    });

    return results;
  }

  async markAsPaid(subscriptionId: string, amount: number, currentUser: any) {
    const sub = await this.prisma.schoolSubscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription record not found');

    const updated = await this.prisma.schoolSubscription.update({
      where: { id: subscriptionId },
      data: {
        amountPaid: amount,
        status: SubscriptionStatus.PAID,
        paidAt: new Date(),
      }
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'MARK_PAID',
      module: 'FINANCE',
      entityId: subscriptionId,
      details: { amount, schoolId: updated.schoolId }
    });

    return updated;
  }

  async update(id: string, data: any, currentUser: any) {
    const updated = await this.prisma.schoolSubscription.update({
      where: { id },
      data: {
        studentCount: data.studentCount,
        ratePerStudent: data.ratePerStudent,
        amountDue: data.amountDue,
        amountPaid: data.amountPaid,
        status: data.status,
        month: data.month,
      }
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'UPDATE_SUBSCRIPTION',
      module: 'FINANCE',
      entityId: id,
      details: data
    });

    return updated;
  }

  async findAll(query: { schoolId?: string; status?: SubscriptionStatus }) {
    return this.prisma.schoolSubscription.findMany({
      where: query,
      include: { school: { select: { name: true } } },
      orderBy: { month: 'desc' }
    });
  }

  async getOverview() {
    const [
      subscriptions,
      stats,
      activeSubscriptions,
      pendingInvoices
    ] = await Promise.all([
      this.prisma.schoolSubscription.findMany({
        include: { school: { select: { name: true } } },
        orderBy: { month: 'desc' },
        take: 50
      }),
      this.prisma.schoolSubscription.aggregate({
        _sum: { amountPaid: true }
      }),
      this.prisma.schoolSubscription.count({
        where: { status: SubscriptionStatus.PAID }
      }),
      this.prisma.schoolSubscription.count({
        where: { status: SubscriptionStatus.PENDING }
      })
    ]);

    return {
      totalRevenue: stats._sum.amountPaid || 0,
      activeSubscriptions,
      pendingInvoices,
      subscriptions
    };
  }
}

import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PdfService } from '../storage/pdf.service';
import { StorageService } from '../storage/storage.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class SchoolSubscriptionsService {
  private readonly logger = new Logger(SchoolSubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private pdfService: PdfService,
    private storageService: StorageService,
  ) {}

  /**
   * Automatically generate bills on the 1st of every month.
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleAutoMonthlyBilling() {
    const month = new Date().toISOString().substring(0, 7); // YYYY-MM
    this.logger.log(`[Cron] Auto-generating bills for ${month}`);
    // System user ID or a placeholder for system actions
    await this.generateMonthlyBills(month, { id: 'SYSTEM', email: 'system@campusgrid.org', role: UserRole.SUPER_ADMIN });
  }

  /**
   * Generates bills for all schools for a specific month.
   * Logic: Count students * 80 RS.
   */
  async generateMonthlyBills(month: string | undefined, currentUser: AuthenticatedUser) {
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

    for (const school of (schools as any[])) {
      const studentCount = school._count.users;
      const rate = school.subscriptionRate || 80;
      const amountDue = studentCount * rate;
      const invoiceId = `INV-${targetMonth.replace('-', '')}-${school.id.substring(school.id.length - 4).toUpperCase()}`;

      // Use upsert to avoid duplicates for the same month
      const subscription = await this.prisma.schoolSubscription.upsert({
        where: {
          schoolId_month: {
            schoolId: (school.id as string),
            month: targetMonth,
          }
        },
        update: {
          studentCount,
          amountDue,
          ratePerStudent: rate,
          invoiceId,
        } as any,
        create: {
          schoolId: (school.id as string),
          month: targetMonth,
          studentCount,
          amountDue,
          ratePerStudent: rate,
          status: SubscriptionStatus.PENDING,
          invoiceId,
        } as any
      });
      results.push(subscription);
    }

    await this.auditService.log({
      userId: currentUser.id,
      action: 'GENERATE_BILLS',
      module: 'FINANCE',
      details: { month: targetMonth, count: results.length }
    });

    return results;
  }

  async markAsPaid(subscriptionId: string, amount: number, currentUser: AuthenticatedUser) {
    // Try to find by id or invoiceId
    const sub = await this.prisma.schoolSubscription.findFirst({
      where: {
        OR: [
          { id: subscriptionId },
          { invoiceId: subscriptionId } as any
        ]
      }
    });

    if (!sub) throw new NotFoundException('Subscription record not found');

    // 1. Prevent double payment
    if (sub.status === SubscriptionStatus.PAID) {
      throw new ConflictException('This invoice has already been paid.');
    }

    // 2. Validate amount
    if (!amount || amount <= 0) {
      throw new ConflictException('A valid payment amount is required.');
    }

    // 3. Generate PDF Invoice
    const school = await this.prisma.school.findUnique({ where: { id: sub.schoolId } });
    const html = this.pdfService.getSubscriptionInvoiceTemplate({
      invoiceId: sub.invoiceId || sub.id,
      schoolName: school?.name || 'School Node',
      month: sub.month,
      studentCount: sub.studentCount,
      ratePerStudent: sub.ratePerStudent,
      amountDue: sub.amountDue,
      amountPaid: amount,
      paidAt: new Date().toLocaleDateString(),
    });

    const pdfBuffer = await this.pdfService.generatePdf(html);
    const storageKey = `invoices/subscription/${sub.invoiceId || sub.id}.pdf`;
    await this.storageService.uploadFile(storageKey, pdfBuffer, 'application/pdf');
    const invoiceUrl = await this.storageService.getPresignedUrl(storageKey);

    // 4. Update the record
    const updated = await this.prisma.schoolSubscription.update({
      where: { id: sub.id },
      data: {
        amountPaid: amount,
        status: SubscriptionStatus.PAID,
        paidAt: new Date(),
        invoiceUrl: invoiceUrl
      }
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'MARK_PAID',
      module: 'FINANCE',
      entityId: sub.id,
      details: { amount, invoiceId: sub.invoiceId }
    });

    return updated;
  }

  async update(id: string, data: any, currentUser: AuthenticatedUser) {
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
        _sum: { 
          amountPaid: true,
          amountDue: true
        }
      }),
      this.prisma.schoolSubscription.count({
        where: { status: SubscriptionStatus.PAID }
      }),
      this.prisma.schoolSubscription.count({
        where: { status: SubscriptionStatus.PENDING }
      })
    ]);

    return {
      totalRevenue: stats._sum.amountDue || 0, // Total value of bills generated
      collectedRevenue: stats._sum.amountPaid || 0, // Actual money received
      activeSubscriptions,
      pendingInvoices,
      recentInvoices: subscriptions // Renamed to match frontend expectation
    };
  }

  async getMrrProjections() {
    const schools = await this.prisma.school.findMany({
      where: { status: 'ACTIVE' },
      select: { 
        subscriptionRate: true,
        _count: { select: { users: { where: { role: 'STUDENT' } } } }
      } as any
    });

    const currentMRR = (schools as any[]).reduce((sum, school) => {
      const rate = school.subscriptionRate || 80;
      const students = school._count?.users || 0;
      return sum + (rate * students);
    }, 0);

    const activePayingNodes = schools.length;
    const averageRevenuePerNode = activePayingNodes > 0 ? Math.floor(currentMRR / activePayingNodes) : 0;

    return {
      currentMRR,
      projectedNextMonthMRR: Math.floor(currentMRR * 1.05), // Assuming 5% growth
      activePayingNodes,
      averageRevenuePerNode,
      currency: 'INR'
    };
  }

  async getSchoolFinance(schoolId: string) {
    const [school, subscriptions] = await Promise.all([
      this.prisma.school.findUnique({
        where: { id: schoolId },
        select: { 
          subscriptionRate: true,
          _count: { select: { users: { where: { role: 'STUDENT' } } } }
        } as any
      }),
      this.prisma.schoolSubscription.findMany({
        where: { schoolId },
        orderBy: { month: 'desc' }
      })
    ]);

    if (!school) throw new NotFoundException('School not found');

    const studentCount = (school as any)._count?.users || 0;
    const rate = Number(school.subscriptionRate || 80);
    const currentMRR = studentCount * rate;

    return {
      currentMRR,
      studentCount,
      ratePerStudent: rate,
      billingHistory: subscriptions
    };
  }
}

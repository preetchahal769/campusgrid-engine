import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Processor('sms-credential-delivery')
export class OnboardingProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { logId, recipientPhone, studentName, username, password, schoolId } = job.data;

    // Increment attempt counter
    await this.prisma.notificationDispatchLog.update({
      where: { id: logId },
      data: { attempts: { increment: 1 } },
    });

    try {
      // Fetch school metadata for template personalization
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
      });
      const schoolName = school?.name || 'SikshaTantar School';

      // Construct Welcome SMS template
      const smsMessage = `🏫 WELCOME TO SIKSHATANTAR\n\nDear Parent, ${studentName}'s profile is now active at ${schoolName}. You can now track school bus routes live, view fee invoices, and download report cards directly from your mobile.\n\n🌐 Portal URL: https://school.sikshatantar.com\n👤 Username: ${username}\n🔑 Temporary Password: ${password}\n\nNote: For security, please reset your password upon your first login.`;

      // Mocking gateway latency (e.g. simulating HTTP post request to SMS API)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Log successful delivery to console for local audits
      console.log(`[SMS Gateway Dispatch Success] Phone: ${recipientPhone} Message: ${smsMessage}`);

      // Update log record to SENT
      await this.prisma.notificationDispatchLog.update({
        where: { id: logId },
        data: { status: 'SENT' },
      });
    } catch (err: any) {
      // Log failure metrics
      await this.prisma.notificationDispatchLog.update({
        where: { id: logId },
        data: {
          status: 'FAILED',
          errorMessage: err.message || 'Unknown network error occurred',
        },
      });
      throw err; // Re-throw so BullMQ handles queue retry sequences
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BugReportsService } from './bug-reports.service';

@Injectable()
export class BugReportsCron {
  private readonly logger = new Logger(BugReportsCron.name);

  constructor(private readonly bugReportsService: BugReportsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleStaleBugReportsCleanup() {
    this.logger.log('Starting nightly cleanup of stale SOLVED bug reports...');
    try {
      const closedCount = await this.bugReportsService.autoCloseStaleReports();
      this.logger.log(`Nightly cleanup complete. Auto-closed ${closedCount} stale bug reports and deleted their screenshots.`);
    } catch (error) {
      this.logger.error('Failed to run nightly bug report cleanup', error);
    }
  }
}

import { Module } from '@nestjs/common';
import { BugReportsController } from './bug-reports.controller';
import { BugReportsService } from './bug-reports.service';
import { BugReportsCron } from './bug-reports.cron';

@Module({
  controllers: [BugReportsController],
  providers: [BugReportsService, BugReportsCron],
})
export class BugReportsModule {}

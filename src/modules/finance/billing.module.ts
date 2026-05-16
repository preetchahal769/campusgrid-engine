import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { SchoolSubscriptionsService } from './school-subscriptions.service';
import { SchoolSubscriptionsController } from './school-subscriptions.controller';
import { FinanceProjectionsController } from './projections.controller';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [
    SchoolSubscriptionsController, 
    FeesController, 
    PayrollController,
    FinanceProjectionsController
  ],
  providers: [PayrollService, SchoolSubscriptionsService, FeesService],
  exports: [SchoolSubscriptionsService, FeesService, PayrollService],
})
export class BillingModule {}

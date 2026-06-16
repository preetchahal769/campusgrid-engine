import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LastActiveInterceptor } from './common/interceptors/last-active.interceptor';

import { UsersModule } from './modules/users/users.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { StudiosModule } from './modules/studios/studios.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { BillingModule } from './modules/finance/billing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { StorageModule } from './modules/storage/storage.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { AuditModule } from './modules/audit/audit.module';
import { SystemModule } from './modules/system/system.module';
import { SupportModule } from './modules/support/support.module';
import { BugReportsModule } from './modules/bug-reports/bug-reports.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 300, // 300 requests per minute (was 10 - too strict for a dashboard)
      },
    ]),
    AuthModule,
    PrismaModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connection: any = {
          host: config.get('REDIS_HOST', 'localhost'),
          port: parseInt(config.get('REDIS_PORT', '6379')),
        };
        if (config.get('REDIS_TLS') === 'true') {
          connection.tls = {};
        }
        return { connection };
      },
    }),
    UsersModule,
    AcademicsModule,
    AttendanceModule,
    StudiosModule,
    CommunicationsModule,
    BillingModule,
    AnalyticsModule,
    StorageModule,
    SchoolsModule,
    AuditModule,
    SystemModule,
    SupportModule,
    BugReportsModule,
    ApprovalsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LastActiveInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

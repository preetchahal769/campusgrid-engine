import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }))
    });
  }

  async onModuleInit() {
    await this.$connect();

    try {
      // Force the creation of the BugReportStatus enum if it doesn't exist.
      // This ensures the database schema matches the Prisma Client even if docker-entrypoint migrations are bypassed.
      await this.$executeRawUnsafe(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BugReportStatus') THEN
            CREATE TYPE "BugReportStatus" AS ENUM ('OPEN', 'WORKING', 'SOLVED', 'REOPENED', 'CLOSED');
          END IF;
        END $$;
      `);

      await this.$executeRawUnsafe(`
        DO $$
        BEGIN
          -- Only attempt to cast if the column is currently of type text/varchar
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'BugReport' AND column_name = 'status' AND data_type IN ('text', 'character varying')
          ) THEN
            ALTER TABLE "BugReport" ALTER COLUMN "status" DROP DEFAULT;
            ALTER TABLE "BugReport" ALTER COLUMN "status" TYPE "BugReportStatus" USING "status"::text::"BugReportStatus";
            ALTER TABLE "BugReport" ALTER COLUMN "status" SET DEFAULT 'OPEN';
          END IF;
        END $$;
      `);
    } catch (err) {
      console.warn('Auto-migration for BugReportStatus skipped or failed:', err.message);
    }
  }
}

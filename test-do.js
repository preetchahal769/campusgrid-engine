const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BugReportStatus') THEN
          CREATE TYPE "BugReportStatus" AS ENUM ('OPEN', 'WORKING', 'SOLVED', 'REOPENED', 'CLOSED');
        END IF;
      END $$;
    `);
    console.log("Success");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();

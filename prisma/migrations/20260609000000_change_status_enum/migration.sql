CREATE TYPE "BugReportStatus" AS ENUM ('OPEN', 'WORKING', 'SOLVED', 'REOPENED', 'CLOSED');
ALTER TABLE "BugReport" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BugReport" ALTER COLUMN "status" TYPE "BugReportStatus" USING "status"::text::"BugReportStatus";
ALTER TABLE "BugReport" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('INFO', 'WARN', 'CRITICAL');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "severity" "LogSeverity" NOT NULL DEFAULT 'INFO';

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "region" VARCHAR;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

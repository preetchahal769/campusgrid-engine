-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "ApprovalTask" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StagedOnboardingBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "schoolId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StagedOnboardingBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StagedOnboardingRecord" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "rollNo" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "StagedOnboardingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDispatchLog" (
    "id" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDispatchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalTask_schoolId_idx" ON "ApprovalTask"("schoolId");

-- CreateIndex
CREATE INDEX "StagedOnboardingBatch_schoolId_idx" ON "StagedOnboardingBatch"("schoolId");

-- CreateIndex
CREATE INDEX "StagedOnboardingBatch_createdBy_idx" ON "StagedOnboardingBatch"("createdBy");

-- CreateIndex
CREATE INDEX "StagedOnboardingRecord_batchId_idx" ON "StagedOnboardingRecord"("batchId");

-- CreateIndex
CREATE INDEX "NotificationDispatchLog_schoolId_idx" ON "NotificationDispatchLog"("schoolId");

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagedOnboardingBatch" ADD CONSTRAINT "StagedOnboardingBatch_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagedOnboardingBatch" ADD CONSTRAINT "StagedOnboardingBatch_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagedOnboardingRecord" ADD CONSTRAINT "StagedOnboardingRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StagedOnboardingBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDispatchLog" ADD CONSTRAINT "NotificationDispatchLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

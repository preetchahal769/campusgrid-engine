-- DropForeignKey
ALTER TABLE "ApprovalTask" DROP CONSTRAINT "ApprovalTask_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "ApprovalTask" DROP CONSTRAINT "ApprovalTask_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "LibraryTransaction" DROP CONSTRAINT "LibraryTransaction_borrowerId_fkey";

-- DropForeignKey
ALTER TABLE "ProfileChangeRequest" DROP CONSTRAINT "ProfileChangeRequest_reviewedById_fkey";

-- DropForeignKey
ALTER TABLE "ProfileChangeRequest" DROP CONSTRAINT "ProfileChangeRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "StagedOnboardingBatch" DROP CONSTRAINT "StagedOnboardingBatch_createdBy_fkey";

-- DropIndex
DROP INDEX "LibraryTransaction_borrowerId_idx";

-- DropIndex
DROP INDEX "ProfileChangeRequest_userId_idx";

-- DropIndex
DROP INDEX "StagedOnboardingBatch_createdBy_idx";

-- AlterTable
ALTER TABLE "ApprovalTask" DROP COLUMN "approvedBy",
DROP COLUMN "createdBy",
ADD COLUMN     "clerkId" TEXT NOT NULL,
ADD COLUMN     "principalId" TEXT;

-- AlterTable
ALTER TABLE "LibraryTransaction" DROP COLUMN "borrowerId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProfileChangeRequest" DROP COLUMN "reviewedById",
DROP COLUMN "userId",
ADD COLUMN     "principalId" TEXT,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "StagedOnboardingBatch" DROP COLUMN "createdBy",
ADD COLUMN     "clerkId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ApprovalTask_clerkId_idx" ON "ApprovalTask"("clerkId");

-- CreateIndex
CREATE INDEX "ApprovalTask_principalId_idx" ON "ApprovalTask"("principalId");

-- CreateIndex
CREATE INDEX "LibraryTransaction_studentId_idx" ON "LibraryTransaction"("studentId");

-- CreateIndex
CREATE INDEX "ProfileChangeRequest_teacherId_idx" ON "ProfileChangeRequest"("teacherId");

-- CreateIndex
CREATE INDEX "ProfileChangeRequest_studentId_idx" ON "ProfileChangeRequest"("studentId");

-- CreateIndex
CREATE INDEX "ProfileChangeRequest_principalId_idx" ON "ProfileChangeRequest"("principalId");

-- CreateIndex
CREATE INDEX "StagedOnboardingBatch_clerkId_idx" ON "StagedOnboardingBatch"("clerkId");

-- AddForeignKey
ALTER TABLE "ProfileChangeRequest" ADD CONSTRAINT "ProfileChangeRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileChangeRequest" ADD CONSTRAINT "ProfileChangeRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileChangeRequest" ADD CONSTRAINT "ProfileChangeRequest_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTransaction" ADD CONSTRAINT "LibraryTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_clerkId_fkey" FOREIGN KEY ("clerkId") REFERENCES "clerks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "principal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagedOnboardingBatch" ADD CONSTRAINT "StagedOnboardingBatch_clerkId_fkey" FOREIGN KEY ("clerkId") REFERENCES "clerks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

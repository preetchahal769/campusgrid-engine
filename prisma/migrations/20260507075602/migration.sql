/*
  Warnings:

  - The `obatinedmarks` column on the `submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'GRADUATED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "transferredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "submission" DROP COLUMN "obatinedmarks",
ADD COLUMN     "obatinedmarks" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "globalRank" INTEGER,
ADD COLUMN     "globalRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

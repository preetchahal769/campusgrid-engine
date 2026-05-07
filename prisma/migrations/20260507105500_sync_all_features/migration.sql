-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "section" ADD COLUMN "classInchargeId" TEXT;

-- CreateTable
CREATE TABLE "timetable" (
    "id" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "lectureNo" INTEGER NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "teachersubjectsection_id" TEXT NOT NULL,

    CONSTRAINT "timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaveRequest" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "attachmentUrl" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "approvedById" TEXT,
    "School_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "section_classInchargeId_key" ON "section"("classInchargeId");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_dayOfWeek_lectureNo_teachersubjectsection_id_key" ON "timetable"("dayOfWeek", "lectureNo", "teachersubjectsection_id");

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_classInchargeId_fkey" FOREIGN KEY ("classInchargeId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable" ADD CONSTRAINT "timetable_teachersubjectsection_id_fkey" FOREIGN KEY ("teachersubjectsection_id") REFERENCES "teachersubjectsection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaveRequest" ADD CONSTRAINT "leaveRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaveRequest" ADD CONSTRAINT "leaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaveRequest" ADD CONSTRAINT "leaveRequest_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable (Handle column removals from previous steps if not already handled)
ALTER TABLE "teachersubjectsection" DROP COLUMN IF EXISTS "dayOfWeek";
ALTER TABLE "teachersubjectsection" DROP COLUMN IF EXISTS "lectureNo";

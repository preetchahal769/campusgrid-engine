-- AlterTable
ALTER TABLE "Escalation" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioRoomSwapRequest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "attachment" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "broadcast" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "leaveRequest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "parent" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "studioRooms" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "substitution" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "teachersubjectsection" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "timetable" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "attendance_users_id_idx" ON "attendance"("users_id");

-- CreateIndex
CREATE INDEX "attendance_School_id_idx" ON "attendance"("School_id");

-- CreateIndex
CREATE INDEX "leaveRequest_studentId_idx" ON "leaveRequest"("studentId");

-- CreateIndex
CREATE INDEX "leaveRequest_approvedById_idx" ON "leaveRequest"("approvedById");

-- CreateIndex
CREATE INDEX "leaveRequest_School_id_idx" ON "leaveRequest"("School_id");

-- CreateIndex
CREATE INDEX "students_School_id_idx" ON "students"("School_id");

-- CreateIndex
CREATE INDEX "students_section_id_idx" ON "students"("section_id");

-- CreateIndex
CREATE INDEX "submission_assigment_id_idx" ON "submission"("assigment_id");

-- CreateIndex
CREATE INDEX "submission_students_id_idx" ON "submission"("students_id");

-- CreateIndex
CREATE INDEX "teachersubjectsection_teachers_id_idx" ON "teachersubjectsection"("teachers_id");

-- CreateIndex
CREATE INDEX "teachersubjectsection_subject_id_idx" ON "teachersubjectsection"("subject_id");

-- CreateIndex
CREATE INDEX "teachersubjectsection_section_id_idx" ON "teachersubjectsection"("section_id");

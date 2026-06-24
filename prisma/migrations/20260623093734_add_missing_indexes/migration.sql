-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_section_id_fkey";

-- CreateIndex
CREATE INDEX "students_users_id_idx" ON "students"("users_id");

-- CreateIndex
CREATE INDEX "timetable_teachersubjectsection_id_idx" ON "timetable"("teachersubjectsection_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

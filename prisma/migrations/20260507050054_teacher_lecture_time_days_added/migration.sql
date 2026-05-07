-- AlterTable
ALTER TABLE "teachersubjectsection" ADD COLUMN     "dayOfWeek" TEXT NOT NULL DEFAULT 'Monday',
ADD COLUMN     "lectureNo" INTEGER NOT NULL DEFAULT 1;

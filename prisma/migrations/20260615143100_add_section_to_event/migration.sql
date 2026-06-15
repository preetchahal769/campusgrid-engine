-- AlterTable
ALTER TABLE "SchoolEvent" ADD COLUMN "section_id" TEXT;

-- AddForeignKey
ALTER TABLE "SchoolEvent" ADD CONSTRAINT "SchoolEvent_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

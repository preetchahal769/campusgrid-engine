-- AlterTable
ALTER TABLE "attachment" ADD COLUMN     "submission_id" TEXT;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

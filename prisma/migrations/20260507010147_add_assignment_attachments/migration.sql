-- DropForeignKey
ALTER TABLE "attachment" DROP CONSTRAINT "attachment_broadcast_id_fkey";

-- AlterTable
ALTER TABLE "attachment" ADD COLUMN     "assigment_id" TEXT,
ALTER COLUMN "broadcast_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "broadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_assigment_id_fkey" FOREIGN KEY ("assigment_id") REFERENCES "assigment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

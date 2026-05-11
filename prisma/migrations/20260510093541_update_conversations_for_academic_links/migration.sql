-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "subjectId" TEXT;

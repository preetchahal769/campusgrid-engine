-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "studioRooms" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "timetable" ADD COLUMN     "studioRoomId" TEXT;

-- CreateTable
CREATE TABLE "StudioRoomSwapRequest" (
    "id" TEXT NOT NULL,
    "fromTimetableId" TEXT NOT NULL,
    "toTimetableId" TEXT,
    "fromTeacherId" TEXT NOT NULL,
    "toTeacherId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioRoomSwapRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "timetable" ADD CONSTRAINT "timetable_studioRoomId_fkey" FOREIGN KEY ("studioRoomId") REFERENCES "studioRooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRoomSwapRequest" ADD CONSTRAINT "StudioRoomSwapRequest_fromTimetableId_fkey" FOREIGN KEY ("fromTimetableId") REFERENCES "timetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRoomSwapRequest" ADD CONSTRAINT "StudioRoomSwapRequest_toTimetableId_fkey" FOREIGN KEY ("toTimetableId") REFERENCES "timetable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRoomSwapRequest" ADD CONSTRAINT "StudioRoomSwapRequest_fromTeacherId_fkey" FOREIGN KEY ("fromTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioRoomSwapRequest" ADD CONSTRAINT "StudioRoomSwapRequest_toTeacherId_fkey" FOREIGN KEY ("toTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

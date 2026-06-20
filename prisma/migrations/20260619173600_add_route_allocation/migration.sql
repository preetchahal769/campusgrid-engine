-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('PENDING_PARENT', 'PENDING_DRIVER', 'ROUTE_LOCKED');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "assigned_stop_location" JSONB,
ADD COLUMN     "route_status" "RouteStatus" NOT NULL DEFAULT 'PENDING_PARENT',
ADD COLUMN     "stop_name" VARCHAR(100),
ADD COLUMN     "student_home_location" JSONB;

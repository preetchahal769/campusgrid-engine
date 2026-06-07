-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT,
    "userRole" TEXT,
    "url" TEXT,
    "description" TEXT,
    "screenshotUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

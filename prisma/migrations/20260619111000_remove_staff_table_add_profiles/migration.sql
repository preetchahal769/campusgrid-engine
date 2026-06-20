-- DropForeignKey
ALTER TABLE "staff" DROP CONSTRAINT "staff_users_id_fkey";

-- DropTable
DROP TABLE "staff";

-- CreateTable
CREATE TABLE "clerks" (
    "id" TEXT NOT NULL,
    "department" VARCHAR,
    "joiningDate" DATE,
    "Experince" TEXT,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clerks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bursars" (
    "id" TEXT NOT NULL,
    "department" VARCHAR,
    "joiningDate" DATE,
    "Experince" TEXT,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bursars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "librarians" (
    "id" TEXT NOT NULL,
    "department" VARCHAR,
    "joiningDate" DATE,
    "Experince" TEXT,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "librarians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_coordinators" (
    "id" TEXT NOT NULL,
    "department" VARCHAR,
    "joiningDate" DATE,
    "Experince" TEXT,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "academic_coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_managers" (
    "id" TEXT NOT NULL,
    "department" VARCHAR,
    "joiningDate" DATE,
    "Experince" TEXT,
    "licenseNumber" VARCHAR,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transport_managers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "clerks" ADD CONSTRAINT "clerks_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bursars" ADD CONSTRAINT "bursars_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "librarians" ADD CONSTRAINT "librarians_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_coordinators" ADD CONSTRAINT "academic_coordinators_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_managers" ADD CONSTRAINT "transport_managers_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

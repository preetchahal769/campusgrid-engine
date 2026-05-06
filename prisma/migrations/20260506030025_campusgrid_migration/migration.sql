-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'STAFF', 'PARENT');

-- CreateTable
CREATE TABLE "assigment" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "dueDate" DATE,
    "maxMarks" INTEGER,
    "expireAt" DATE,
    "subject_id" TEXT NOT NULL,
    "teachers_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,

    CONSTRAINT "assigment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" TEXT NOT NULL,
    "fileurl" TEXT,
    "filetype" TEXT,
    "filename" TEXT,
    "broadcast_id" TEXT NOT NULL,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast" (
    "id" TEXT NOT NULL,
    "title" VARCHAR,
    "message" VARCHAR,
    "targetrole" VARCHAR,
    "attachment" VARCHAR,
    "author_id" TEXT NOT NULL,

    CONSTRAINT "broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "School_id" TEXT NOT NULL,

    CONSTRAINT "grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principal" (
    "id" TEXT NOT NULL,
    "qualification" VARCHAR,
    "experinceYear" INTEGER,
    "joiningDate" DATE,
    "signatureUrl" VARCHAR,
    "School_id" TEXT NOT NULL,
    "users_id" TEXT NOT NULL,

    CONSTRAINT "principal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" VARCHAR,
    "rankingPoint" INTEGER,
    "city" VARCHAR,
    "pincode" INTEGER,
    "education board" VARCHAR,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "grade_id" TEXT NOT NULL,

    CONSTRAINT "section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "department" VARCHAR,
    "joiningDate" DATE,
    "Experince" TEXT,
    "monthly salary" INTEGER,
    "licenseNumber" INTEGER,
    "assignedArea" VARCHAR,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "admissionNumber" VARCHAR,
    "rollNumber" INTEGER,
    "dateOfBirth" DATE,
    "bloodGroup" VARCHAR,
    "fatherName" VARCHAR,
    "motherName" VARCHAR,
    "emergencyContact" VARCHAR,
    "rankingPoints" INTEGER,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studioRoomBooking" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "starttime" DATE,
    "endTime" DATE,
    "teachers_id" TEXT NOT NULL,
    "studioRooms_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,

    CONSTRAINT "studioRoomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studioRooms" (
    "id" TEXT NOT NULL,
    "roomName" TEXT,
    "status" INTEGER,
    "hardwareIp" INTEGER,
    "School_id" TEXT NOT NULL,

    CONSTRAINT "studioRooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL,
    "name " VARCHAR,
    "type" VARCHAR,
    "code" VARCHAR,
    "School_id" TEXT NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "status" TEXT,
    "obatinedmarks" TEXT,
    "submittedAt" DATE,
    "assigment_id" TEXT NOT NULL,
    "students_id" TEXT NOT NULL,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "qualification" VARCHAR,
    "specilization" VARCHAR,
    "joiningDate" DATE,
    "Experince" TEXT,
    "monthlySalary" INTEGER,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachersubjectsection" (
    "id" TEXT NOT NULL,
    "teachers_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,

    CONSTRAINT "teachersubjectsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent" (
    "id" TEXT NOT NULL,
    "users_id" TEXT NOT NULL,
    "School_id" TEXT NOT NULL,
    "students_id" TEXT NOT NULL,

    CONSTRAINT "parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR,
    "email" VARCHAR,
    "password" VARCHAR,
    "phoneNo" VARCHAR,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "School_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "assigment" ADD CONSTRAINT "assigment_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assigment" ADD CONSTRAINT "assigment_teachers_id_fkey" FOREIGN KEY ("teachers_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assigment" ADD CONSTRAINT "assigment_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "broadcast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade" ADD CONSTRAINT "grade_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "principal" ADD CONSTRAINT "principal_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studioRoomBooking" ADD CONSTRAINT "studioRoomBooking_teachers_id_fkey" FOREIGN KEY ("teachers_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studioRoomBooking" ADD CONSTRAINT "studioRoomBooking_studioRooms_id_fkey" FOREIGN KEY ("studioRooms_id") REFERENCES "studioRooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studioRooms" ADD CONSTRAINT "studioRooms_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_assigment_id_fkey" FOREIGN KEY ("assigment_id") REFERENCES "assigment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_students_id_fkey" FOREIGN KEY ("students_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachersubjectsection" ADD CONSTRAINT "teachersubjectsection_teachers_id_fkey" FOREIGN KEY ("teachers_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachersubjectsection" ADD CONSTRAINT "teachersubjectsection_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachersubjectsection" ADD CONSTRAINT "teachersubjectsection_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_students_id_fkey" FOREIGN KEY ("students_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "substitution" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "originalTeacherId" TEXT NOT NULL,
    "subTeacherId" TEXT NOT NULL,
    "role" VARCHAR,
    "message" VARCHAR,
    "School_id" TEXT NOT NULL,

    CONSTRAINT "substitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "substitution_date_timetable_id_key" ON "substitution"("date", "timetable_id");

-- AddForeignKey
ALTER TABLE "substitution" ADD CONSTRAINT "substitution_timetable_id_fkey" FOREIGN KEY ("timetable_id") REFERENCES "timetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitution" ADD CONSTRAINT "substitution_originalTeacherId_fkey" FOREIGN KEY ("originalTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitution" ADD CONSTRAINT "substitution_subTeacherId_fkey" FOREIGN KEY ("subTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitution" ADD CONSTRAINT "substitution_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

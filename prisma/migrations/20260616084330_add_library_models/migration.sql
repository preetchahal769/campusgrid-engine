-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('BORROWED', 'RETURNED', 'OVERDUE');

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "category" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "School_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryTransaction" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL DEFAULT 'BORROWED',
    "School_id" TEXT NOT NULL,

    CONSTRAINT "LibraryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_School_id_idx" ON "Book"("School_id");

-- CreateIndex
CREATE INDEX "LibraryTransaction_bookId_idx" ON "LibraryTransaction"("bookId");

-- CreateIndex
CREATE INDEX "LibraryTransaction_borrowerId_idx" ON "LibraryTransaction"("borrowerId");

-- CreateIndex
CREATE INDEX "LibraryTransaction_School_id_idx" ON "LibraryTransaction"("School_id");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTransaction" ADD CONSTRAINT "LibraryTransaction_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTransaction" ADD CONSTRAINT "LibraryTransaction_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTransaction" ADD CONSTRAINT "LibraryTransaction_School_id_fkey" FOREIGN KEY ("School_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

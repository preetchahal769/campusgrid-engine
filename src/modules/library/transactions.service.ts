import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CheckoutBookDto } from './dto/library.dto';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkoutBook(dto: CheckoutBookDto, user: any) {
    if (!user.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

    // 1. Find borrower by email
    const borrower = await this.prisma.users.findFirst({
      where: {
        email: dto.borrowerEmail,
        School_id: user.School_id,
      },
    });

    if (!borrower) {
      throw new NotFoundException('Borrower not found with that email.');
    }

    // 2. Find book and check availability
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book || book.deletedAt) {
      throw new NotFoundException('Book not found.');
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException('No copies available for checkout.');
    }

    // 3. Perform transaction
    const [transaction] = await this.prisma.$transaction([
      this.prisma.libraryTransaction.create({
        data: {
          bookId: dto.bookId,
          borrowerId: borrower.id,
          dueDate: new Date(dto.dueDate),
          School_id: user.School_id,
          status: TransactionStatus.BORROWED,
        },
        include: {
          book: true,
          borrower: { select: { name: true, email: true } },
        },
      }),
      this.prisma.book.update({
        where: { id: dto.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    return transaction;
  }

  async returnBook(id: string, user: any) {
    if (!user.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

    const transaction = await this.prisma.libraryTransaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.School_id !== user.School_id) {
      throw new NotFoundException('Transaction record not found.');
    }

    if (transaction.returnedAt) {
      throw new BadRequestException('Book has already been returned.');
    }

    // Update transaction and increment book copies
    const [updated] = await this.prisma.$transaction([
      this.prisma.libraryTransaction.update({
        where: { id },
        data: {
          returnedAt: new Date(),
          status: TransactionStatus.RETURNED,
        },
        include: {
          book: true,
          borrower: { select: { name: true, email: true } },
        },
      }),
      this.prisma.book.update({
        where: { id: transaction.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    return updated;
  }

  async findTransactions(schoolId: string) {
    return this.prisma.libraryTransaction.findMany({
      where: { School_id: schoolId },
      include: {
        book: true,
        borrower: { select: { name: true, email: true, role: true } },
      },
      orderBy: { borrowedAt: 'desc' },
    });
  }
}

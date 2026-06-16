import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBookDto } from './dto/library.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async createBook(dto: CreateBookDto, user: any) {
    if (!user.School_id) {
      throw new ForbiddenException('User must belong to a school.');
    }

    return this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn || null,
        category: dto.category || null,
        totalCopies: dto.totalCopies,
        availableCopies: dto.totalCopies,
        School_id: user.School_id,
      },
    });
  }

  async findBooks(schoolId: string, q?: string) {
    return this.prisma.book.findMany({
      where: {
        School_id: schoolId,
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { author: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
                { isbn: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

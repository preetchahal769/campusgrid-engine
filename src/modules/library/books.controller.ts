import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/library.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('library/books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL, UserRole.LIBRARIAN)
  create(@Body() dto: CreateBookDto, @Request() req: AuthenticatedRequest) {
    return this.booksService.createBook(dto, req.user);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.PRINCIPAL,
    UserRole.LIBRARIAN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.BURSAR,
    UserRole.ACADEMIC_COORDINATOR,
    UserRole.TRANSPORT_MANAGER
  )
  findAll(@Query('q') q: string, @Request() req: AuthenticatedRequest) {
    const schoolId = req.user.School_id;
    if (!schoolId) {
      throw new Error('User must belong to a school.');
    }
    return this.booksService.findBooks(schoolId, q);
  }
}

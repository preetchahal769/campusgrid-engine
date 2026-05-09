import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async create(createGradeDto: CreateGradeDto, currentUser: any) {
    let targetSchoolId = createGradeDto.School_id;

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to create a class.');
      }
      targetSchoolId = currentUser.School_id;
    } else if (!targetSchoolId) {
      throw new ForbiddenException('Super Admin must provide a School_id to create a class.');
    }

    // Uniqueness Check: Only one class with a specific name per school
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        name: createGradeDto.name,
        School_id: targetSchoolId as string,
      },
    });

    if (existingGrade) {
      throw new ConflictException(`Class '${createGradeDto.name}' already exists in this school.`);
    }

    return this.prisma.grade.create({
      data: {
        name: createGradeDto.name,
        School_id: targetSchoolId as string,
      },
    });
  }

  async findAll(currentUser: any) {
    const whereClause: any = {};
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('School ID not found in user context.');
      }
      whereClause.School_id = currentUser.School_id;
    }

    return this.prisma.grade.findMany({
      where: whereClause,
      include: {
        section: true
      }
    });
  }
}

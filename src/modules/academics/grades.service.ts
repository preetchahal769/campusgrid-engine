import { Injectable, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGradeDto, SectionSeriesType } from './dto/create-grade.dto';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  private getSectionName(index: number, seriesType: SectionSeriesType): string {
    if (seriesType === SectionSeriesType.NUMERIC) {
      return (index + 1).toString();
    }
    if (seriesType === SectionSeriesType.ROMAN) {
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
      return romanNumerals[index] || `Sec-${index + 1}`;
    }
    // Default: ALPHABET
    return String.fromCharCode(65 + index); // 65 is 'A'
  }

  async create(createGradeDto: CreateGradeDto, currentUser: AuthenticatedUser) {
    let targetSchoolId = createGradeDto.School_id;

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to create a class.');
      }
      targetSchoolId = currentUser.School_id;
    } else if (!targetSchoolId) {
      throw new ForbiddenException('Super Admin must provide a School_id to create a class.');
    }

    const classesCount = createGradeDto.classesCount || 1;
    const startNumber = createGradeDto.startNumber || 1;
    const sectionsCount = createGradeDto.sectionsCount || 0;
    const seriesType = createGradeDto.sectionSeriesType || SectionSeriesType.ALPHABET;

    return this.prisma.$transaction(async (tx) => {
      const createdGrades: any[] = [];

      for (let c = 0; c < classesCount; c++) {
        const gradeName = classesCount > 1 
          ? `${createGradeDto.name} ${startNumber + c}`.trim()
          : createGradeDto.name.trim();

        const existing = await tx.grade.findFirst({
          where: {
            name: gradeName,
            School_id: targetSchoolId as string,
          },
        });

        if (existing) {
          throw new ConflictException(`Class '${gradeName}' already exists in this school.`);
        }

        const grade = await tx.grade.create({
          data: {
            name: gradeName,
            School_id: targetSchoolId as string,
          },
        });

        if (sectionsCount > 0) {
          const sectionsData = Array.from({ length: sectionsCount }, (_, i) => ({
            name: this.getSectionName(i, seriesType),
            grade_id: grade.id,
          }));

          await tx.section.createMany({
            data: sectionsData,
          });
        }

        createdGrades.push(grade);
      }

      return tx.grade.findMany({
        where: {
          id: { in: createdGrades.map((g) => g.id) },
        },
        include: {
          section: true,
        },
      });
    });
  }

  async findAll(currentUser: AuthenticatedUser) {
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

  async delete(id: string, currentUser: AuthenticatedUser) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
    });
    if (!grade) throw new NotFoundException('Class not found.');

    if (currentUser.role !== UserRole.SUPER_ADMIN && grade.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You can only delete classes in your own school.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Auto-unassign students in sections under this grade
      await tx.students.updateMany({
        where: {
          section: {
            grade_id: id
          }
        },
        data: {
          section_id: null
        }
      });

      // Delete associated sections first
      await tx.section.deleteMany({
        where: { grade_id: id },
      });

      return tx.grade.delete({
        where: { id },
      });
    });
  }
}

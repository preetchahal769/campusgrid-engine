import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto, currentUser: AuthenticatedUser) {
    let targetSchoolId = createSubjectDto.School_id;

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to create a subject.');
      }
      targetSchoolId = currentUser.School_id;
    } else if (!targetSchoolId) {
      throw new ForbiddenException('Super Admin must provide a School_id to create a subject.');
    }

    // Uniqueness Check: Only one subject with a specific name per school
    const existingSubject = await this.prisma.subject.findFirst({
      where: {
        name: createSubjectDto.name,
        School_id: targetSchoolId as string,
      },
    });

    if (existingSubject) {
      throw new ConflictException(`Subject '${createSubjectDto.name}' already exists in this school.`);
    }

    return this.prisma.subject.create({
      data: {
        name: createSubjectDto.name,
        type: createSubjectDto.type,
        code: createSubjectDto.code,
        School_id: targetSchoolId as string,
      },
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

    return this.prisma.subject.findMany({
      where: whereClause,
    });
  }
}

import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async create(createSectionDto: CreateSectionDto, currentUser: any) {
    const { name, grade_id } = createSectionDto;

    const grade = await this.prisma.grade.findUnique({
      where: { id: grade_id },
    });

    if (!grade) {
      throw new NotFoundException('Class (grade) not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && grade.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You can only create sections for your own school.');
    }

    // Uniqueness Check: Only one section with a specific name per class
    const existingSection = await this.prisma.section.findFirst({
      where: {
        name,
        grade_id,
      },
    });

    if (existingSection) {
      throw new ConflictException(`Section '${name}' already exists in this class.`);
    }

    return this.prisma.section.create({
      data: {
        name,
        grade_id,
      },
    });
  }

  async assignIncharge(sectionId: string, teacherId: string, currentUser: any) {
    // 1. Fetch section and teacher to verify existence
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { grade: true }
    });
    if (!section) throw new NotFoundException('Section not found.');

    const teacher = await this.prisma.teachers.findUnique({
      where: { id: teacherId }
    });
    if (!teacher) throw new NotFoundException('Teacher not found.');

    // 2. Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (section.grade.School_id !== currentUser.School_id || teacher.School_id !== currentUser.School_id) {
        throw new ForbiddenException('Section or Teacher belongs to a different school.');
      }
    }

    // 3. Update the section with the class incharge
    return this.prisma.section.update({
      where: { id: sectionId },
      data: { classInchargeId: teacherId }
    });
  }
}

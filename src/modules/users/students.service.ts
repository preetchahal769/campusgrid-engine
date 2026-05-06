import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { BulkUpdateSectionDto } from './dto/bulk-update-section.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async createProfile(createStudentProfileDto: CreateStudentProfileDto, currentUser: any) {
    const { users_id, section_id, ...rest } = createStudentProfileDto;
    let targetSchoolId = createStudentProfileDto.School_id;

    // Check permissions and school context
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to attach students.');
      }
      targetSchoolId = currentUser.School_id;
    } else if (!targetSchoolId) {
      throw new ForbiddenException('Super Admin must provide a School_id.');
    }

    // Verify user exists and is a STUDENT
    const user = await this.prisma.users.findUnique({ where: { id: users_id } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role !== UserRole.STUDENT) throw new ConflictException('User is not a student.');

    // Verify section exists and belongs to the same school
    const section = await this.prisma.section.findUnique({
      where: { id: section_id },
      include: { grade: true },
    });
    if (!section) throw new NotFoundException('Section not found.');
    if (section.grade.School_id !== targetSchoolId) {
      throw new ForbiddenException('Section does not belong to your school.');
    }

    // Check if student profile already exists
    const existingProfile = await this.prisma.students.findFirst({
      where: { users_id },
    });

    if (existingProfile) {
      // Update existing profile (move section)
      return this.prisma.students.update({
        where: { id: existingProfile.id },
        data: {
          section_id,
          School_id: targetSchoolId as string,
          ...rest,
          dateOfBirth: rest.dateOfBirth ? new Date(rest.dateOfBirth) : undefined,
        },
      });
    }

    // Create new student profile
    return this.prisma.students.create({
      data: {
        users_id,
        section_id,
        School_id: targetSchoolId as string,
        admissionNumber: rest.admissionNumber,
        rollNumber: rest.rollNumber,
        bloodGroup: rest.bloodGroup,
        fatherName: rest.fatherName,
        motherName: rest.motherName,
        emergencyContact: rest.emergencyContact,
        dateOfBirth: rest.dateOfBirth ? new Date(rest.dateOfBirth) : undefined,
      },
    });
  }

  async findAll(currentUser: any) {
    const whereClause: any = {};
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to view students.');
      }
      whereClause.School_id = currentUser.School_id;
    }

    return this.prisma.students.findMany({
      where: whereClause,
      include: {
        users: { select: { name: true, email: true, phoneNo: true } },
        section: {
          include: { grade: true }
        }
      }
    });
  }

  async findMyProfile(currentUser: any) {
    const profile = await this.prisma.students.findFirst({
      where: { users_id: currentUser.userId },
      include: {
        users: { select: { name: true, email: true, phoneNo: true } },
        section: {
          include: { grade: true }
        }
      }
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found.');
    }

    return profile;
  }

  async updateProfile(id: string, updateDto: UpdateStudentProfileDto, currentUser: any) {
    const existingProfile = await this.prisma.students.findUnique({
      where: { id },
    });

    if (!existingProfile) throw new NotFoundException('Student profile not found.');

    if (currentUser.role !== UserRole.SUPER_ADMIN && existingProfile.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You can only edit students in your own school.');
    }

    if (updateDto.section_id) {
      const section = await this.prisma.section.findUnique({
        where: { id: updateDto.section_id },
        include: { grade: true },
      });
      if (!section) throw new NotFoundException('Target section not found.');
      
      const targetSchoolId = currentUser.role === UserRole.SUPER_ADMIN 
        ? updateDto.School_id || existingProfile.School_id 
        : currentUser.School_id;

      if (section.grade.School_id !== targetSchoolId) {
        throw new ForbiddenException('The new section does not belong to the correct school.');
      }
    }

    return this.prisma.students.update({
      where: { id },
      data: {
        ...updateDto,
        dateOfBirth: updateDto.dateOfBirth ? new Date(updateDto.dateOfBirth) : undefined,
      },
    });
  }

  async updateBulkSection(bulkDto: BulkUpdateSectionDto, currentUser: any) {
    const { studentIds, section_id } = bulkDto;

    const section = await this.prisma.section.findUnique({
      where: { id: section_id },
      include: { grade: true },
    });
    if (!section) throw new NotFoundException('Target section not found.');

    if (currentUser.role !== UserRole.SUPER_ADMIN && section.grade.School_id !== currentUser.School_id) {
      throw new ForbiddenException('The target section does not belong to your school.');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      const students = await this.prisma.students.findMany({
        where: { id: { in: studentIds } },
      });
      
      for (const student of students) {
        if (student.School_id !== currentUser.School_id) {
          throw new ForbiddenException(`Student ${student.id} does not belong to your school.`);
        }
      }
    }

    return this.prisma.students.updateMany({
      where: { id: { in: studentIds } },
      data: { section_id },
    });
  }
}

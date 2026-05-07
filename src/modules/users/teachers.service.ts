import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async createProfile(createTeacherProfileDto: CreateTeacherProfileDto, currentUser: any) {
    const { users_id, ...rest } = createTeacherProfileDto;
    let targetSchoolId = createTeacherProfileDto.School_id;

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to create teacher profiles.');
      }
      targetSchoolId = currentUser.School_id;
    } else if (!targetSchoolId) {
      throw new ForbiddenException('Super Admin must provide a School_id.');
    }

    const user = await this.prisma.users.findUnique({ where: { id: users_id } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role !== UserRole.TEACHER) throw new ConflictException('User is not a teacher.');

    const existingProfile = await this.prisma.teachers.findFirst({
      where: { users_id },
    });

    if (existingProfile) {
      throw new ConflictException('Teacher profile already exists.');
    }

    return this.prisma.teachers.create({
      data: {
        users_id,
        School_id: targetSchoolId as string,
        qualification: rest.qualification,
        specilization: rest.specilization,
        Experince: rest.Experince,
        monthlySalary: rest.monthlySalary,
        joiningDate: rest.joiningDate ? new Date(rest.joiningDate) : undefined,
      },
    });
  }

  async assignSubjectAndSection(assignTeacherDto: AssignTeacherDto, currentUser: any) {
    const { teachers_id, subject_id, section_id, lectureNo, dayOfWeek } = assignTeacherDto;

    // Fetch the teacher profile
    const teacher = await this.prisma.teachers.findUnique({
      where: { id: teachers_id },
    });
    if (!teacher) throw new NotFoundException('Teacher profile not found.');

    // Fetch the section and subject
    const section = await this.prisma.section.findUnique({
      where: { id: section_id },
      include: { grade: true },
    });
    if (!section) throw new NotFoundException('Section not found.');

    const subject = await this.prisma.subject.findUnique({
      where: { id: subject_id },
    });
    if (!subject) throw new NotFoundException('Subject not found.');

    // Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (teacher.School_id !== currentUser.School_id) {
        throw new ForbiddenException('Teacher does not belong to your school.');
      }
      if (section.grade.School_id !== currentUser.School_id) {
        throw new ForbiddenException('Section does not belong to your school.');
      }
      if (subject.School_id !== currentUser.School_id) {
        throw new ForbiddenException('Subject does not belong to your school.');
      }
    }

    // Timetable Conflict Check:
    // 1. Is this specific teacher already busy during this lecture?
    const teacherBusy = await this.prisma.teachersubjectsection.findFirst({
      where: {
        teachers_id,
        dayOfWeek,
        lectureNo,
      },
    });
    if (teacherBusy) {
      throw new ConflictException('Teacher is already assigned to another lecture at this time.');
    }

    // 2. Is this specific section already having a lecture at this time?
    const sectionOccupied = await this.prisma.teachersubjectsection.findFirst({
      where: {
        section_id,
        dayOfWeek,
        lectureNo,
      },
    });
    if (sectionOccupied) {
      throw new ConflictException('This section already has a lecture assigned at this time.');
    }

    return this.prisma.teachersubjectsection.create({
      data: {
        teachers_id,
        subject_id,
        section_id,
        lectureNo,
        dayOfWeek,
      },
    });
  }
}

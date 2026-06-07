import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { UserRole } from '@prisma/client';
import { MessagesService } from '../communications/messages.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  async createProfile(createTeacherProfileDto: CreateTeacherProfileDto, currentUser: AuthenticatedUser) {
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
        experience: rest.experience,
        monthlySalary: rest.monthlySalary,
        joiningDate: rest.joiningDate ? new Date(rest.joiningDate) : undefined,
      },
    });
  }

  async assignSubjectAndSection(assignTeacherDto: AssignTeacherDto, currentUser: AuthenticatedUser) {
    const { teachers_id, subject_id, section_id } = assignTeacherDto;

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

    // Check if the exact assignment already exists
    const existingAssignment = await this.prisma.teachersubjectsection.findFirst({
      where: {
        teachers_id,
        subject_id,
        section_id,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Teacher is already assigned to this subject and section.');
    }

    const assignment = await this.prisma.teachersubjectsection.create({
      data: {
        teachers_id,
        subject_id,
        section_id,
      },
    });

    // Create Subject Group Chat
    await this.messagesService.createSubjectGroup(
      subject_id,
      section_id,
      teacher.users_id,
      teacher.School_id
    );

    return assignment;
  }

  async findMyProfile(currentUser: AuthenticatedUser) {
    const profile = await this.prisma.teachers.findFirst({
      where: { users_id: currentUser.id },
      include: {
        users: { select: { name: true, email: true, phoneNo: true } },
        teachersubjectsection: {
          include: {
            subject: { select: { name: true, code: true } },
            section: { include: { grade: true } }
          }
        }
      }
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found.');
    }

    return profile;
  }

  async updateProfile(currentUser: AuthenticatedUser, updateDto: any) {
    const profile = await this.prisma.teachers.findFirst({
      where: { users_id: currentUser.id },
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found.');
    }

    const { qualification, specilization } = updateDto;

    // Check if fields are empty
    const isQualificationEmpty = !profile.qualification;
    const isSpecilizationEmpty = !profile.specilization;

    const canUpdateDirectly = 
      (qualification && isQualificationEmpty) || 
      (specilization && isSpecilizationEmpty);

    if (canUpdateDirectly) {
      // Update directly what is empty
      const updateData: any = {};
      if (qualification && isQualificationEmpty) updateData.qualification = qualification;
      if (specilization && isSpecilizationEmpty) updateData.specilization = specilization;

      await this.prisma.teachers.update({
        where: { id: profile.id },
        data: updateData,
      });

      // If they also tried to update non-empty fields, spawn a request for those
      if ((qualification && !isQualificationEmpty) || (specilization && !isSpecilizationEmpty)) {
        if (currentUser.School_id) {
          await this.prisma.profileChangeRequest.create({
            data: {
              userId: currentUser.id,
              School_id: currentUser.School_id,
              requestedQualification: qualification && !isQualificationEmpty ? qualification : undefined,
              requestedSpecilization: specilization && !isSpecilizationEmpty ? specilization : undefined,
              status: 'PENDING',
            }
          });
          return { success: true, message: 'Some fields were updated directly, others are pending approval.', pendingApproval: true };
        }
      }

      return { success: true, message: 'Teacher profile updated successfully.' };
    }

    // If nothing could be updated directly, it means fields are full, require approval
    if (currentUser.School_id && (qualification || specilization)) {
      await this.prisma.profileChangeRequest.create({
        data: {
          userId: currentUser.id,
          School_id: currentUser.School_id,
          requestedQualification: qualification !== profile.qualification ? qualification : undefined,
          requestedSpecilization: specilization !== profile.specilization ? specilization : undefined,
          status: 'PENDING',
        }
      });
      return { success: true, message: 'Change request submitted for approval.', pendingApproval: true };
    }

    return { success: true, message: 'No changes made.' };
  }

  async findAll(currentUser: AuthenticatedUser) {
    const whereClause: any = {};
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('School ID not found in user context.');
      }
      whereClause.School_id = currentUser.School_id;
    }

    return this.prisma.teachers.findMany({
      where: whereClause,
      include: {
        users: { select: { name: true, email: true, phoneNo: true } },
        teachersubjectsection: {
          include: {
            subject: { select: { name: true, code: true } },
            section: { include: { grade: true } }
          }
        }
      }
    });
  }
}

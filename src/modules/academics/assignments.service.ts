import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto, currentUser: any) {
    // 1. Ensure user is a Teacher
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can create assignments.');
    }

    // 2. Get Teacher Profile ID
    const teacherProfile = await this.prisma.teachers.findFirst({
      where: { users_id: currentUser.id }
    });

    if (!teacherProfile) {
      throw new ForbiddenException('Teacher profile not found for this user.');
    }

    const { title, description, dueDate, maxMarks, subject_id, section_id, attachments } = createAssignmentDto;

    // 3. Verify Teacher is assigned to this Section and Subject
    const isAssigned = await this.prisma.teachersubjectsection.findFirst({
      where: {
        teachers_id: teacherProfile.id,
        subject_id,
        section_id
      }
    });

    if (!isAssigned) {
      throw new ForbiddenException('You are not assigned to this section or subject.');
    }

    // 4. Create Assignment
    return this.prisma.assigment.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxMarks,
        subject_id,
        section_id,
        teachers_id: teacherProfile.id,
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map(att => ({
            filename: att.filename,
            filetype: att.filetype,
            fileurl: att.fileurl,
          }))
        } : undefined
      },
      select: {
        id: true,
        title: true,
        attachments: true,
        subject: { select: { name: true } },
        section: { select: { name: true } }
      }
    });
  }

  async fetchForUser(currentUser: any) {
    if (currentUser.role === UserRole.STUDENT) {
      const studentProfile = await this.prisma.students.findFirst({
        where: { users_id: currentUser.id, status: 'ACTIVE' }
      });

      if (!studentProfile) return [];

      return this.prisma.assigment.findMany({
        where: { section_id: studentProfile.section_id },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxMarks: true,
          attachments: true,
          subject: { select: { name: true } },
          teachers: {
            select: {
              users: { select: { name: true } }
            }
          },
          submission: {
            where: { students_id: studentProfile.id },
            select: { id: true, status: true, submittedAt: true, obatinedmarks: true }
          }
        },
        orderBy: { id: 'desc' }
      });

    } else if (currentUser.role === UserRole.TEACHER) {
      const teacherProfile = await this.prisma.teachers.findFirst({
        where: { users_id: currentUser.id }
      });

      if (!teacherProfile) return [];

      return this.prisma.assigment.findMany({
        where: { teachers_id: teacherProfile.id },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxMarks: true,
          attachments: true,
          section: { select: { name: true } },
          subject: { select: { name: true } },
          _count: { select: { submission: true } }
        },
        orderBy: { id: 'desc' }
      });
    }

    if (!currentUser.School_id) return [];

    return this.prisma.assigment.findMany({
      where: {
        section: {
          grade: { School_id: currentUser.School_id }
        }
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        section: { select: { name: true } },
        subject: { select: { name: true } },
        teachers: {
          select: {
            users: { select: { name: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });
  }

  async getAllowedContexts(currentUser: any) {
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can access allowed assignment contexts.');
    }

    const teacherProfile = await this.prisma.teachers.findFirst({
      where: { users_id: currentUser.id }
    });

    if (!teacherProfile) {
      throw new ForbiddenException('Teacher profile not found.');
    }

    return this.prisma.teachersubjectsection.findMany({
      where: { teachers_id: teacherProfile.id },
      select: {
        id: true,
        subject: {
          select: { id: true, name: true, code: true }
        },
        section: {
          select: {
            id: true,
            name: true,
            grade: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
  }

  async submit(assignmentId: string, submissionDto: { content?: string, fileUrl?: string }, currentUser: any) {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can submit assignments.');
    }

    const studentProfile = await this.prisma.students.findFirst({
      where: { users_id: currentUser.id }
    });

    if (!studentProfile) {
      throw new ForbiddenException('Student profile not found.');
    }

    // Check if assignment exists and belongs to student's section
    const assignment = await this.prisma.assigment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    if (assignment.section_id !== studentProfile.section_id) {
      throw new ForbiddenException('This assignment is not for your class.');
    }

    // Upsert submission (allow re-submission)
    const existingSubmission = await this.prisma.submission.findFirst({
      where: {
        assigment_id: assignmentId,
        students_id: studentProfile.id
      }
    });

    if (existingSubmission) {
      return this.prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content: submissionDto.content,
          fileUrl: submissionDto.fileUrl,
          submittedAt: new Date(),
          status: 'SUBMITTED'
        }
      });
    }

    return this.prisma.submission.create({
      data: {
        content: submissionDto.content,
        fileUrl: submissionDto.fileUrl,
        submittedAt: new Date(),
        status: 'SUBMITTED',
        assigment_id: assignmentId,
        students_id: studentProfile.id
      }
    });
  }

  async grade(submissionId: string, marks: number, currentUser: any) {
    // 1. Fetch the submission to verify existence and get the student/assignment context
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assigment: true,
        students: { select: { School_id: true, users_id: true } }
      }
    });

    if (!submission) throw new NotFoundException('Submission not found.');

    // 2. Enforce school boundaries
    if (currentUser.role !== UserRole.SUPER_ADMIN && submission.students.School_id !== currentUser.School_id) {
      throw new ForbiddenException('You can only grade submissions from your own school.');
    }

    // 3. Update the submission marks
    const updatedSubmission = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        obatinedmarks: marks,
        status: 'GRADED'
      }
    });

    // 4. Recalculate Global Rating for the student
    await this.analytics.recalculateGlobalRating(submission.students.users_id);

    return updatedSubmission;
  }
}

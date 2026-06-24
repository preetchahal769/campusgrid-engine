import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { UserRole } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { MessagesService } from '../communications/messages.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { getOrLoadStudentProfile } from '../../common/utils/profile-loader';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
    private storageService: StorageService,
    private messagesService: MessagesService,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto, currentUser: AuthenticatedUser, files?: Express.Multer.File[]) {
    // 1. Ensure user is a Teacher
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can create assignments.');
    }

    if (!currentUser.School_id) {
      throw new ForbiddenException('Teacher must belong to a school.');
    }

    // 2. Get Teacher Profile ID
    const teacherProfile = await this.prisma.teachers.findFirst({
      where: { users_id: currentUser.id }
    });

    if (!teacherProfile) {
      throw new ForbiddenException('Teacher profile not found for this user.');
    }

    const { title, description, dueDate, maxMarks, subject_id, section_id, attachments, isDraft } = createAssignmentDto;

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

    // 4. Handle File Uploads
    const dbAttachments: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const key = `assignments/${Date.now()}-${file.originalname}`;
        await this.storageService.uploadFile(key, file.buffer, file.mimetype);
        dbAttachments.push({
          filename: file.originalname,
          filetype: file.mimetype,
          fileurl: key,
        });
      }
    }

    // Add legacy attachments if provided
    if (attachments && attachments.length > 0) {
      dbAttachments.push(...attachments);
    }

    // 5. Create Assignment
    const assignment = await this.prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxMarks,
        subject_id,
        section_id,
        isDraft: isDraft || false,
        teachers_id: teacherProfile.id,
        attachments: dbAttachments.length > 0 ? {
          create: dbAttachments
        } : undefined
      },
    });

    // 6. Create Assignment Group Chat
    await this.messagesService.createAssignmentGroup(
      assignment.id,
      section_id,
      currentUser.id,
      currentUser.School_id
    );

    return assignment;
  }

  async fetchForUser(currentUser: AuthenticatedUser) {
    let assignments: any[] = [];

    if (currentUser.role === UserRole.STUDENT) {
      const studentProfile = await getOrLoadStudentProfile(this.prisma, currentUser);

      if (!studentProfile || !studentProfile.section_id) return [];

      assignments = await this.prisma.assignment.findMany({
        where: { 
          section_id: studentProfile.section_id,
          isDraft: false
        },
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
            select: { 
              id: true, 
              status: true, 
              submittedAt: true, 
              obtainedMarks: true, 
              fileUrl: true,
              attachments: true 
            }
          }
        },
        orderBy: { id: 'desc' }
      });

    } else if (currentUser.role === UserRole.TEACHER) {
      const teacherProfile = await this.prisma.teachers.findFirst({
        where: { users_id: currentUser.id }
      });

      if (!teacherProfile) return [];

      assignments = await this.prisma.assignment.findMany({
        where: { teachers_id: teacherProfile.id },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxMarks: true,
          isDraft: true,
          attachments: true,
          section: { select: { name: true } },
          subject: { select: { name: true } },
          _count: { select: { submission: true } }
        },
        orderBy: { id: 'desc' }
      });
    } else {
      if (!currentUser.School_id) return [];

      assignments = await this.prisma.assignment.findMany({
        where: {
          section: {
            grade: { School_id: currentUser.School_id }
          }
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          attachments: true,
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

    // Transform attachments and submissions with presigned URLs
    const transformedAssignments = await Promise.all(assignments.map(async (assig) => {
      // 1. Assignment Attachments (Teachers' files)
      if (assig.attachments && Array.isArray(assig.attachments)) {
        for (const att of assig.attachments) {
          if (att.fileurl && !att.fileurl.startsWith('http')) {
            att.fileurl = await this.storageService.getPresignedUrl(att.fileurl);
          }
        }
      }

      // 2. Submission Details (Students' files)
      let submissionInfo: any = null;
      let isSubmitted = false;

      if (assig.submission && Array.isArray(assig.submission) && assig.submission.length > 0) {
        const sub = assig.submission[0] as any;
        isSubmitted = true;
        
        // Check for multi-file attachments (New system)
        if (sub.attachments && Array.isArray(sub.attachments)) {
          for (const att of sub.attachments) {
            if (att.fileurl && !att.fileurl.startsWith('http')) {
              att.fileurl = await this.storageService.getPresignedUrl(att.fileurl);
            }
          }
        }
        // Legacy check for single fileUrl
        if (sub.fileUrl && !sub.fileUrl.startsWith('http')) {
          sub.fileUrl = await this.storageService.getPresignedUrl(sub.fileUrl);
        }

        // Calculate dynamic letter grade and percentage
        if (sub.obtainedMarks !== null && sub.obtainedMarks !== undefined && assig.maxMarks) {
          const percent = Math.round((sub.obtainedMarks / assig.maxMarks) * 100);
          sub.percentage = percent;
          sub.letterGrade = this.calculateLetterGrade(percent);
        }

        submissionInfo = sub;
      }

      return {
        ...assig,
        isSubmitted,
        submission: submissionInfo // Now an object, not an array
      };
    }));

    return transformedAssignments;
  }

  async getAllowedContexts(currentUser: AuthenticatedUser) {
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

  async submit(assignmentId: string, submissionDto: { content?: string }, currentUser: AuthenticatedUser, files?: Express.Multer.File[]) {
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
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    if (assignment.section_id !== studentProfile.section_id) {
      throw new ForbiddenException('This assignment is not for your class.');
    }

    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      throw new ForbiddenException('Late submissions are blocked for this assignment.');
    }

    // 3. Check for existing submission to prevent duplicates
    const existingSubmission = await this.prisma.submission.findFirst({
      where: {
        assignment_id: assignmentId,
        students_id: studentProfile.id
      }
    });

    if (existingSubmission) {
      throw new ForbiddenException('You have already submitted this assignment.');
    }

    // 4. Handle file uploads and image-to-PDF compilation
    const dbAttachments: any[] = [];
    const processedFiles: { originalname: string; buffer: Buffer; mimetype: string }[] = [];

    if (files && files.length > 0) {
      const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
      const otherFiles = files.filter(f => !f.mimetype.startsWith('image/'));

      if (imageFiles.length > 0) {
        try {
          const { PDFDocument } = require('pdf-lib');
          const pdfDoc = await PDFDocument.create();
          let embeddedAny = false;

          for (const imgFile of imageFiles) {
            try {
              let image;
              if (imgFile.mimetype === 'image/png') {
                image = await pdfDoc.embedPng(imgFile.buffer);
              } else if (imgFile.mimetype === 'image/jpeg' || imgFile.mimetype === 'image/jpg') {
                image = await pdfDoc.embedJpg(imgFile.buffer);
              }

              if (image) {
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                  x: 0,
                  y: 0,
                  width: image.width,
                  height: image.height,
                });
                embeddedAny = true;
              }
            } catch (err) {
              console.error('Failed to embed image in PDF:', err);
              processedFiles.push(imgFile);
            }
          }

          if (embeddedAny) {
            const pdfBytes = await pdfDoc.save();
            processedFiles.push({
              originalname: 'compiled_homework.pdf',
              buffer: Buffer.from(pdfBytes),
              mimetype: 'application/pdf',
            });
          } else {
            processedFiles.push(...imageFiles);
          }
        } catch (pdfErr) {
          console.error('pdf-lib compilation failed, falling back to original uploads:', pdfErr);
          processedFiles.push(...imageFiles);
        }
      }

      processedFiles.push(...otherFiles);

      for (const file of processedFiles) {
        const key = `submissions/${assignmentId}/${studentProfile.id}-${Date.now()}-${file.originalname}`;
        await this.storageService.uploadFile(key, file.buffer, file.mimetype);
        dbAttachments.push({
          filename: file.originalname,
          filetype: file.mimetype,
          fileurl: key,
        });
      }
    }

    return this.prisma.submission.create({
      data: {
        content: submissionDto.content,
        submittedAt: new Date(),
        status: 'SUBMITTED',
        assignment_id: assignmentId,
        students_id: studentProfile.id,
        attachments: dbAttachments.length > 0 ? {
          create: dbAttachments
        } : undefined
      }
    });
  }

  async grade(submissionId: string, marks: number, currentUser: AuthenticatedUser) {
    // 1. Fetch the submission to verify existence and get the student/assignment context
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
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
        obtainedMarks: marks,
        status: 'GRADED'
      }
    });

    // 4. Recalculate Global Rating for the student
    await this.analytics.recalculateGlobalRating(submission.students.users_id);

    return updatedSubmission;
  }

  async findById(id: string, currentUser: AuthenticatedUser) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        attachments: true,
        subject: { select: { name: true } },
        section: { select: { name: true } },
        teachers: {
          select: { users: { select: { name: true } } }
        }
      }
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    // Transform attachments
    if (assignment.attachments) {
      for (const att of assignment.attachments) {
        if (att.fileurl && !att.fileurl.startsWith('http')) {
          att.fileurl = await this.storageService.getPresignedUrl(att.fileurl);
        }
      }
    }

    return assignment;
  }

  async fetchSubmissions(assignmentId: string, currentUser: AuthenticatedUser) {
    // 1. Ensure user is Teacher or Admin
    if (currentUser.role === UserRole.STUDENT) {
      throw new ForbiddenException('Students cannot view all submissions.');
    }

    const submissions = await this.prisma.submission.findMany({
      where: { assignment_id: assignmentId },
      include: {
        students: {
          select: {
            id: true,
            rollNumber: true,
            users: { select: { name: true } }
          }
        },
        attachments: true,
        assignment: { select: { maxMarks: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // 2. Generate Presigned URLs for submission files
    for (const sub of submissions as any[]) {
      if (sub.attachments) {
        for (const att of sub.attachments) {
          if (att.fileurl && !att.fileurl.startsWith('http')) {
            att.fileurl = await this.storageService.getPresignedUrl(att.fileurl);
          }
        }
      }
      if (sub.fileUrl && !sub.fileUrl.startsWith('http')) {
        sub.fileUrl = await this.storageService.getPresignedUrl(sub.fileUrl);
      }

      // Add dynamic letter grade
      if (sub.obtainedMarks !== null && sub.obtainedMarks !== undefined && sub.assignment?.maxMarks) {
        const percent = Math.round((sub.obtainedMarks / sub.assignment.maxMarks) * 100);
        sub.percentage = percent;
        sub.letterGrade = this.calculateLetterGrade(percent);
      }
    }

    return submissions;
  }

  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 95) return 'A++';
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 33) return 'E';
    return 'F';
  }
}

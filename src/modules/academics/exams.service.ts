import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExamDto, CreateExamScheduleDto, BulkResultSubmitDto } from './dto/exam.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async createExam(dto: CreateExamDto) {
    return this.prisma.exam.create({
      data: dto,
    });
  }

  async findAllExams(schoolId: string) {
    return this.prisma.exam.findMany({
      where: { School_id: schoolId },
      include: {
        _count: { select: { schedules: true } }
      }
    });
  }

  async scheduleExam(dto: CreateExamScheduleDto) {
    // Check if schedule already exists
    const existing = await this.prisma.examSchedule.findUnique({
      where: {
        examId_subjectId_sectionId: {
          examId: dto.examId,
          subjectId: dto.subjectId,
          sectionId: dto.sectionId,
        }
      }
    });

    if (existing) throw new ConflictException('This subject is already scheduled for this exam and section.');

    return this.prisma.examSchedule.create({
      data: {
        ...dto,
        date: new Date(dto.date),
      },
    });
  }

  async getSchedulesByExam(examId: string) {
    return this.prisma.examSchedule.findMany({
      where: { examId },
      include: {
        subject: { select: { name: true, code: true } },
        section: { select: { name: true, grade: { select: { name: true } } } },
      }
    });
  }

  async submitResults(dto: BulkResultSubmitDto) {
    const { examScheduleId, results } = dto;

    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId }
    });
    if (!schedule) throw new NotFoundException('Exam schedule not found');

    return this.prisma.$transaction(
      results.map(res => this.prisma.examResult.upsert({
        where: {
          examScheduleId_studentId: {
            examScheduleId,
            studentId: res.studentId,
          }
        },
        update: {
          obtainedMarks: res.obtainedMarks,
          remarks: res.remarks,
          grade: res.grade,
        },
        create: {
          examScheduleId,
          studentId: res.studentId,
          obtainedMarks: res.obtainedMarks,
          remarks: res.remarks,
          grade: res.grade,
        }
      }))
    );
  }

  async getScheduleResults(examScheduleId: string) {
    return this.prisma.examResult.findMany({
      where: { examScheduleId },
      select: {
        studentId: true,
        obtainedMarks: true,
        remarks: true,
        grade: true
      }
    });
  }

  async getStudentReport(studentId: string, examId: string) {
    const results = await this.prisma.examResult.findMany({
      where: {
        studentId,
        examSchedule: { examId }
      },
      include: {
        examSchedule: {
          include: {
            subject: { select: { name: true, code: true } }
          }
        }
      }
    });

    if (results.length === 0) throw new NotFoundException('No results found for this student in this exam.');

    const totalObtained = results.reduce((sum, res) => sum + res.obtainedMarks, 0);
    const totalMax = results.reduce((sum, res) => sum + res.examSchedule.maxMarks, 0);
    const percentage = (totalObtained / totalMax) * 100;

    return {
      results: results.map(r => ({
        subject: r.examSchedule.subject.name,
        obtainedMarks: r.obtainedMarks,
        maxMarks: r.examSchedule.maxMarks,
        grade: r.grade,
        remarks: r.remarks,
      })),
      summary: {
        totalObtained,
        totalMax,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    };
  }

  async findTeacherSchedules(currentUser: AuthenticatedUser) {
    const teacher = await this.prisma.teachers.findFirst({
      where: { users_id: currentUser.id }
    });
    if (!teacher) throw new NotFoundException('Teacher profile not found.');

    return this.prisma.examSchedule.findMany({
      where: {
        section: {
          teachersubjectsection: {
            some: {
              teachers_id: teacher.id
            }
          }
        },
        subject: {
          teachersubjectsection: {
            some: {
              teachers_id: teacher.id
            }
          }
        }
      },
      include: {
        exam: { select: { title: true, term: true } },
        subject: { select: { name: true, code: true } },
        section: { select: { name: true, grade: { select: { name: true } } } }
      }
    });
  }

  async generateReportCardPdf(studentId: string, examId: string) {
    const student = await this.prisma.students.findUnique({
      where: { id: studentId },
      include: {
        users: { select: { name: true } },
        section: { include: { grade: true } }
      }
    });
    if (!student) throw new NotFoundException('Student profile not found.');

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId }
    });
    if (!exam) throw new NotFoundException('Exam not found.');

    const report = await this.getStudentReport(studentId, examId);

    const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title / Header
    page.drawText('SIKSHATANTAR ACADEMIC TRANSCRIPT', { x: 120, y: 740, size: 20, font: fontBold, color: rgb(0.04, 0.31, 0.65) });
    page.drawText(`Exam: ${exam.title} (${exam.term})`, { x: 50, y: 700, size: 12, font });
    page.drawText(`Student: ${student.users.name}`, { x: 50, y: 680, size: 12, font: fontBold });
    const className = student.section ? `${student.section.grade.name} - ${student.section.name}` : 'Unassigned';
    page.drawText(`Class: ${className}`, { x: 50, y: 660, size: 12, font });
    page.drawText(`Roll No: ${student.rollNumber || 'N/A'}`, { x: 50, y: 640, size: 12, font });

    // Table Headers
    page.drawRectangle({ x: 50, y: 590, width: 500, height: 25, color: rgb(0.9, 0.9, 0.9) });
    page.drawText('Subject', { x: 60, y: 598, size: 10, font: fontBold });
    page.drawText('Max Marks', { x: 220, y: 598, size: 10, font: fontBold });
    page.drawText('Obtained', { x: 320, y: 598, size: 10, font: fontBold });
    page.drawText('Grade', { x: 420, y: 598, size: 10, font: fontBold });

    let y = 560;
    for (const res of report.results) {
      page.drawText(res.subject || '', { x: 60, y, size: 10, font });
      page.drawText(res.maxMarks.toString(), { x: 220, y, size: 10, font });
      page.drawText(res.obtainedMarks.toString(), { x: 320, y, size: 10, font });
      page.drawText(res.grade || 'N/A', { x: 420, y, size: 10, font });
      y -= 25;
    }

    // Summary block
    y -= 20;
    page.drawRectangle({ x: 50, y, width: 500, height: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;
    page.drawText('SUMMARY', { x: 50, y, size: 12, font: fontBold, color: rgb(0.04, 0.31, 0.65) });
    y -= 20;
    page.drawText(`Total Obtained: ${report.summary.totalObtained} / ${report.summary.totalMax}`, { x: 50, y, size: 10, font });
    y -= 15;
    page.drawText(`Percentage: ${report.summary.percentage}%`, { x: 50, y, size: 10, font });

    // Signature Block
    y -= 60;
    page.drawText('___________________________', { x: 380, y, size: 10, font });
    y -= 15;
    page.drawText('Principal Signature', { x: 410, y, size: 10, font: fontBold });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

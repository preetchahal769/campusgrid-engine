import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExamDto, CreateExamScheduleDto, BulkResultSubmitDto } from './dto/exam.dto';

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
}

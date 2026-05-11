import { IsString, IsEnum, IsDateString, IsInt, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from '@prisma/client';

export class CreateExamDto {
  @IsString()
  title: string;

  @IsString()
  term: string;

  @IsEnum(ExamType)
  @IsOptional()
  type?: ExamType;

  @IsString()
  School_id: string;
}

export class CreateExamScheduleDto {
  @IsString()
  examId: string;

  @IsString()
  subjectId: string;

  @IsString()
  sectionId: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  maxMarks: number;

  @IsInt()
  @IsOptional()
  passMarks?: number;
}

export class StudentResultDto {
  @IsString()
  studentId: string;

  @IsNumber()
  obtainedMarks: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  grade?: string;
}

export class BulkResultSubmitDto {
  @IsString()
  examScheduleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentResultDto)
  results: StudentResultDto[];
}

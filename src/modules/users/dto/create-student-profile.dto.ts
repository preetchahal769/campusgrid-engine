import { IsNotEmpty, IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateStudentProfileDto {
  @IsNotEmpty()
  @IsString()
  users_id: string;

  @IsNotEmpty()
  @IsString()
  section_id: string;

  @IsOptional()
  @IsString()
  School_id?: string;

  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @IsOptional()
  @IsInt()
  rollNumber?: number;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
}

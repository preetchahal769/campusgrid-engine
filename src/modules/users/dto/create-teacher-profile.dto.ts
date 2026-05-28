import { IsNotEmpty, IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateTeacherProfileDto {
  @IsNotEmpty()
  @IsString()
  users_id: string;

  @IsOptional()
  @IsString()
  School_id?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  specilization?: string;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsInt()
  monthlySalary?: number;
}

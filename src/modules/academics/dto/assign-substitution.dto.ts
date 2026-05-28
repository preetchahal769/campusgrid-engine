import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class AssignSubstitutionDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  timetableId: string;

  @IsNotEmpty()
  @IsString()
  subTeacherId: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

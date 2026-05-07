import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateTimetableDto {
  @IsNotEmpty()
  @IsString()
  dayOfWeek: string;

  @IsNotEmpty()
  @IsInt()
  lectureNo: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsNotEmpty()
  @IsString()
  teachersubjectsection_id: string;
}

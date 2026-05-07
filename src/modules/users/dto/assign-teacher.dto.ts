import { IsNotEmpty, IsString } from 'class-validator';

export class AssignTeacherDto {
  @IsNotEmpty()
  @IsString()
  teachers_id: string;

  @IsNotEmpty()
  @IsString()
  subject_id: string;

  @IsNotEmpty()
  @IsString()
  section_id: string;
}

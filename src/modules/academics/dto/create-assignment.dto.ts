import { IsString, IsOptional, IsInt, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class AssignmentAttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  filetype: string;

  @IsString()
  fileurl: string;
}

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxMarks?: number;

  @IsString()
  subject_id: string;

  @IsString()
  section_id: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentAttachmentDto)
  attachments?: AssignmentAttachmentDto[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isDraft?: boolean;
}

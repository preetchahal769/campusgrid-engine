import { IsString, IsOptional, IsInt, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
}

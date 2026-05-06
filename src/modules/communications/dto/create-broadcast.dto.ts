import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum TargetType {
  ALL = 'ALL',
  ROLE = 'ROLE',
  CLASS = 'CLASS',
  SECTION = 'SECTION',
  USER = 'USER',
}

export class TargetDto {
  @IsNotEmpty()
  @IsEnum(TargetType)
  type: TargetType;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}

export class AttachmentDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  filetype?: string;

  @IsOptional()
  @IsString()
  fileurl?: string;
}

export class CreateBroadcastDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TargetDto)
  target: TargetDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

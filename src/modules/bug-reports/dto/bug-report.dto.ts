import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BugReportStatus } from '@prisma/client';

export class CreateBugReportDto {
  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  userRole?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBugReportStatusDto {
  @IsEnum(BugReportStatus)
  status: BugReportStatus;
}

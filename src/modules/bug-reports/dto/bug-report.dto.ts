import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';

export enum BugReportStatus {
  OPEN = 'OPEN',
  WORKING = 'WORKING',
  SOLVED = 'SOLVED',
  REOPENED = 'REOPENED',
  CLOSED = 'CLOSED',
}

export class CreateBugReportDto {
  @IsString()
  @IsOptional()
  userEmail?: string;

  @IsString()
  @IsOptional()
  userRole?: string;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  screenshotUrl?: string;
}

export class UpdateBugReportStatusDto {
  @IsEnum(BugReportStatus, {
    message: 'status must be a valid BugReportStatus value',
  })
  status: BugReportStatus;
}

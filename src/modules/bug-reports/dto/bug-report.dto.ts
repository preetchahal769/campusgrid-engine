import { IsString, IsOptional } from 'class-validator';

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
  @IsString()
  status: string;
}

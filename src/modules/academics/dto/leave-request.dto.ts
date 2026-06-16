import { IsNotEmpty, IsString, IsDateString, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { LeaveStatus } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}

export class UpdateLeaveStatusDto {
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @IsOptional()
  @IsDateString()
  approvedStartDate?: string;

  @IsOptional()
  @IsDateString()
  approvedEndDate?: string;
}

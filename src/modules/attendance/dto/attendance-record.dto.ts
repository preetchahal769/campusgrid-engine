import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordDto {
  @IsNotEmpty()
  @IsString()
  users_id: string;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

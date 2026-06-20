import { IsString, IsNotEmpty, IsObject, IsEnum } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class CreateApprovalTaskDto {
  @IsString()
  @IsNotEmpty()
  module: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsObject()
  @IsNotEmpty()
  payload: any;
}

export class HandleApprovalDto {
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status: ApprovalStatus;
}

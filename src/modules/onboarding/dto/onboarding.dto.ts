import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OnboardingRecordDto {
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @IsString()
  @IsNotEmpty()
  parentPhone: string;

  @IsString()
  @IsNotEmpty()
  className: string;

  @IsInt()
  @IsOptional()
  rollNo?: number;
}

export class CreateStagedOnboardingBatchDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingRecordDto)
  records: OnboardingRecordDto[];
}

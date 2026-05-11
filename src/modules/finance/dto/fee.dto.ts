import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateFeeStructureDto {
  @IsString()
  gradeId: string;

  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsString()
  frequency: string; // e.g., MONTHLY

  @IsString()
  School_id: string;
}

export class GenerateFeeBillsDto {
  @IsString()
  month: string;

  @IsString()
  gradeId: string;
}

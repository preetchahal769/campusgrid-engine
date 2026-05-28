import { IsString, IsNumber, IsOptional } from 'class-validator';

export class SetSalaryStructureDto {
  @IsString()
  userId: string;

  @IsNumber()
  baseSalary: number;

  @IsNumber()
  @IsOptional()
  allowances?: number;

  @IsNumber()
  @IsOptional()
  deductions?: number;
}

export class GeneratePayrollDto {
  @IsString()
  month: string; // Format: YYYY-MM
}

import { IsNotEmpty, IsString, IsOptional, IsInt, IsDateString, IsUrl } from 'class-validator';

export class CreatePrincipalProfileDto {
  @IsNotEmpty()
  @IsString()
  users_id: string;

  @IsOptional()
  @IsString()
  School_id?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsInt()
  experinceYear?: number;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsUrl()
  signatureUrl?: string;
}

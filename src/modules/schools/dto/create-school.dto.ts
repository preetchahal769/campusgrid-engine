import { IsString, IsInt, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSchoolDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsInt()
  @IsOptional()
  pincode?: number;

  @IsString()
  @IsOptional()
  education_board?: string;

  @IsOptional()
  subscriptionRate?: number;
}

export class CreatePrincipalAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phoneNo?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsInt()
  @IsOptional()
  experienceYears?: number;
}

export class CreateSchoolWithPrincipalDto {
  @ValidateNested()
  @Type(() => CreateSchoolDto)
  school: CreateSchoolDto;

  @ValidateNested()
  @Type(() => CreatePrincipalAccountDto)
  principal: CreatePrincipalAccountDto;
}

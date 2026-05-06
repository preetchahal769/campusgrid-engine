import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsString()
  phoneNo?: string;

  @IsNotEmpty()
  @IsEnum(UserRole, {
    message: 'Role must be a valid UserRole',
  })
  role: UserRole;

  @IsOptional()
  @IsString()
  School_id?: string;
}

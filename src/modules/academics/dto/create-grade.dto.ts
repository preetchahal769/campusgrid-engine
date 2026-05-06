import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGradeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  School_id?: string;
}

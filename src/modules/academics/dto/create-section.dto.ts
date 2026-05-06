import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSectionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  grade_id: string;
}

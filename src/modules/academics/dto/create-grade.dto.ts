import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum SectionSeriesType {
  ALPHABET = 'ALPHABET',
  NUMERIC = 'NUMERIC',
  ROMAN = 'ROMAN'
}

export class CreateGradeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  School_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  classesCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  startNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  sectionsCount?: number;

  @IsOptional()
  @IsEnum(SectionSeriesType)
  sectionSeriesType?: SectionSeriesType;
}

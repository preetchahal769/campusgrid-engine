import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { EventType } from '@prisma/client';

export class CreateTermDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  School_id: string;
}

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(EventType)
  type: EventType;

  @IsString()
  School_id: string;

  @IsString()
  @IsOptional()
  section_id?: string;
}

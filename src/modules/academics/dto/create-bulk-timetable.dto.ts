import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTimetableDto } from './create-timetable.dto';

export class CreateBulkTimetableDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetableDto)
  slots: CreateTimetableDto[];
}

import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class BulkUpdateSectionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studentIds: string[];

  @IsNotEmpty()
  @IsString()
  section_id: string;
}

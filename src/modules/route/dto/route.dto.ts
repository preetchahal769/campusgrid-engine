import { IsString, IsNumber, MaxLength } from 'class-validator';

export class ParentSubmitDto {
  @IsString()
  student_id: string;

  @IsNumber()
  home_lat: number;

  @IsNumber()
  home_lng: number;
}

export class DriverAssignDto {
  @IsString()
  student_id: string;

  @IsNumber()
  stop_lat: number;

  @IsNumber()
  stop_lng: number;

  @IsString()
  @MaxLength(100, { message: 'Stop name must be under 100 characters' })
  stop_name: string;
}

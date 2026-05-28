import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';

export class CreateStudioRoomDto {
  @IsString()
  roomName: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  status?: number;

  @IsInt()
  @IsOptional()
  hardwareIp?: number;

  @IsString()
  School_id: string;
}

export class UpdateStudioRoomDto {
  @IsString()
  @IsOptional()
  roomName?: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  status?: number;

  @IsInt()
  @IsOptional()
  hardwareIp?: number;
}

export class DistributionConfigDto {
  @IsInt()
  @IsOptional()
  lecturesPerClassPerWeek?: number = 2;
}

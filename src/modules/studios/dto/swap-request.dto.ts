import { IsString, IsOptional } from 'class-validator';

export class CreateSwapRequestDto {
  @IsString()
  fromTimetableId: string;

  @IsString()
  @IsOptional()
  toTimetableId?: string; // Optional if transferring studio slot without getting one back

  @IsString()
  toTeacherId: string;
}

export class RespondSwapRequestDto {
  @IsString()
  status: 'APPROVED' | 'REJECTED';
}

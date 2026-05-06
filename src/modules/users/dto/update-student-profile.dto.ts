import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateStudentProfileDto } from './create-student-profile.dto';

export class UpdateStudentProfileDto extends PartialType(
  OmitType(CreateStudentProfileDto, ['users_id'] as const),
) {}

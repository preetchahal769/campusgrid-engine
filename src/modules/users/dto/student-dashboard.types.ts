import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phoneNo?: string;

  @Field({ nullable: true })
  role?: string;

  @Field(() => Float, { nullable: true })
  globalRating?: number;

  @Field(() => Int, { nullable: true })
  globalRank?: number;
}

@ObjectType()
export class GradeType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class SectionType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  grade_id?: string;

  @Field(() => GradeType, { nullable: true })
  grade?: GradeType;
}

@ObjectType()
export class StudentProfileType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  admissionNumber?: string;

  @Field({ nullable: true })
  rollNumber?: string;

  @Field({ nullable: true })
  dateOfBirth?: string;

  @Field({ nullable: true })
  bloodGroup?: string;

  @Field({ nullable: true })
  fatherName?: string;

  @Field({ nullable: true })
  motherName?: string;

  @Field({ nullable: true })
  emergencyContact?: string;

  @Field(() => Int, { nullable: true })
  rankingPoints?: number;

  @Field()
  users_id: string;

  @Field()
  School_id: string;

  @Field({ nullable: true })
  section_id?: string;

  @Field(() => Float)
  discountPercentage: number;

  @Field(() => Float, { nullable: true })
  monthlyFee?: number;

  @Field()
  status: string;

  @Field()
  enrolledAt: Date;

  @Field({ nullable: true })
  transferredAt?: Date;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field({ nullable: true })
  student_home_location?: string;

  @Field({ nullable: true })
  assigned_stop_location?: string;

  @Field({ nullable: true })
  stop_name?: string;

  @Field({ nullable: true })
  route_status?: string;

  @Field(() => UserType)
  users: UserType;

  @Field(() => SectionType, { nullable: true })
  section?: SectionType;

  @Field({ nullable: true })
  todayAttendance?: string;
}

@ObjectType()
export class SubjectType {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class TeacherType {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => UserType, { nullable: true })
  users?: UserType;
}

@ObjectType()
export class SubmissionType {
  @Field(() => ID)
  id: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  submittedAt?: Date;

  @Field(() => Float, { nullable: true })
  obtainedMarks?: number;

  @Field({ nullable: true })
  fileUrl?: string;
}

@ObjectType()
export class AssignmentType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field(() => Float, { nullable: true })
  maxMarks?: number;

  @Field({ nullable: true })
  isDraft?: boolean;

  @Field(() => SubjectType, { nullable: true })
  subject?: SubjectType;

  @Field(() => TeacherType, { nullable: true })
  teachers?: TeacherType;

  @Field(() => SubmissionType, { nullable: true })
  submission?: SubmissionType;

  @Field({ nullable: true })
  isSubmitted?: boolean;
}

@ObjectType()
export class StudioRoomType {
  @Field({ nullable: true })
  roomName?: string;
}

@ObjectType()
export class TeacherSubjectSectionType {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => SubjectType, { nullable: true })
  subject?: SubjectType;

  @Field(() => TeacherType, { nullable: true })
  teachers?: TeacherType;
}

@ObjectType()
export class TimetableType {
  @Field(() => ID)
  id: string;

  @Field()
  dayOfWeek: string;

  @Field({ nullable: true })
  startTime?: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field(() => Int)
  lectureNo: number;

  @Field({ nullable: true })
  room?: string;

  @Field(() => StudioRoomType, { nullable: true })
  studioRoom?: StudioRoomType;

  @Field(() => TeacherSubjectSectionType, { nullable: true })
  teachersubjectsection?: TeacherSubjectSectionType;
}

@ObjectType()
export class AttendanceRecordType {
  @Field()
  date: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  title?: string;
}

@ObjectType()
export class AttendanceStatsType {
  @Field(() => Int)
  present: number;

  @Field(() => Int)
  absent: number;

  @Field(() => Int)
  leave: number;

  @Field(() => Int)
  holiday: number;

  @Field(() => Int)
  unmarked: number;

  @Field(() => Int)
  percentage: number;
}

@ObjectType()
export class AttendanceResponseType {
  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field(() => [AttendanceRecordType])
  days: AttendanceRecordType[];

  @Field(() => AttendanceStatsType)
  stats: AttendanceStatsType;
}

@ObjectType()
export class AttachmentType {
  @Field(() => ID)
  id: string;

  @Field()
  filename: string;

  @Field()
  filetype: string;

  @Field()
  fileurl: string;
}

@ObjectType()
export class AuthorType {
  @Field()
  name: string;

  @Field({ nullable: true })
  role?: string;
}

@ObjectType()
export class BroadcastType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  targetrole: string;

  @Field({ nullable: true })
  createdAt?: string;

  @Field(() => [AttachmentType], { nullable: true })
  attachments?: AttachmentType[];

  @Field(() => AuthorType, { nullable: true })
  author?: AuthorType;
}

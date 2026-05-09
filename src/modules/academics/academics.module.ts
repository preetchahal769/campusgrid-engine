import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { GradesService } from './grades.service';
import { SectionsService } from './sections.service';
import { SubjectsService } from './subjects.service';
import { TimetableService } from './timetable.service';
import { LeavesService } from './leaves.service';
import { AcademicsController } from './academics.controller';
import { PrismaModule } from '../../database/prisma.module';

import { SubstitutionsService } from './substitutions.service';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicsController],
  providers: [AssignmentsService, GradesService, SectionsService, SubjectsService, TimetableService, LeavesService, SubstitutionsService]
})
export class AcademicsModule {}

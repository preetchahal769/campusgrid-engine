import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { GradesService } from './grades.service';
import { SectionsService } from './sections.service';
import { SubjectsService } from './subjects.service';
import { AcademicsController } from './academics.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicsController],
  providers: [AssignmentsService, GradesService, SectionsService, SubjectsService]
})
export class AcademicsModule {}

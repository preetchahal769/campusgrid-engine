import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { PrincipalsController } from './principals.controller';
import { PrincipalsService } from './principals.service';
import { PrismaModule } from '../../database/prisma.module';
import { CommunicationsModule } from '../communications/communications.module';
import { AcademicsModule } from '../academics/academics.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { StudentsResolver } from './students.resolver';

@Module({
  imports: [PrismaModule, CommunicationsModule, AcademicsModule, AttendanceModule],
  controllers: [UsersController, StudentsController, TeachersController, PrincipalsController],
  providers: [UsersService, StudentsService, TeachersService, PrincipalsService, StudentsResolver]
})
export class UsersModule {}

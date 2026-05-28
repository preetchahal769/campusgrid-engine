import { Module } from '@nestjs/common';
import { StudiosService } from './studios.service';
import { StudiosController } from './studios.controller';
import { StudioRequestsService } from './studio-requests.service';
import { StudioRequestsController } from './studio-requests.controller';

@Module({
  controllers: [StudiosController, StudioRequestsController],
  providers: [StudiosService, StudioRequestsService],
  exports: [StudiosService],
})
export class StudiosModule {}

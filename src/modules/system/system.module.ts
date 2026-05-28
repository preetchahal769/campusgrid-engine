import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController, InfrastructureController } from './system.controller';

@Module({
  controllers: [SystemController, InfrastructureController],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule {}

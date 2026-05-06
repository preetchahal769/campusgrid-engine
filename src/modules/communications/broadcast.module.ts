import { Module } from '@nestjs/common';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsController } from './broadcasts.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BroadcastsController],
  providers: [BroadcastsService]
})
export class BroadcastModule {}

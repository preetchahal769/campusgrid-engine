import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesProcessor } from './messages.processor';
import { NotificationsService } from './notifications.service';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsController } from './broadcasts.controller';
import { PrismaModule } from '../../database/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    BullModule.registerQueue({
      name: 'message-delivery',
    }),
  ],
  controllers: [MessagesController, BroadcastsController],
  providers: [
    MessagesService,
    MessagesGateway,
    MessagesProcessor,
    NotificationsService,
    BroadcastsService,
  ],
  exports: [MessagesService, BroadcastsService, NotificationsService],
})
export class CommunicationsModule {}

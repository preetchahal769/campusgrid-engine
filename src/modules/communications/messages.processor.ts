import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { MessagesGateway } from './messages.gateway';
import { NotificationsService } from './notifications.service';

@Processor('message-delivery')
export class MessagesProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private gateway: MessagesGateway,
    private notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { messageId, conversationId, senderId } = job.data;

    // 1. Fetch full message and participants
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: { select: { name: true, id: true } } }
    });

    if (!message) return;

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true }
    });

    // 2. Broadcast to all participants (except sender)
    for (const participant of participants) {
      if (participant.userId === senderId) continue;

      if (this.gateway.isUserOnline(participant.userId)) {
        // Send via Socket.io
        this.gateway.sendToUser(participant.userId, 'new_message', {
          ...message,
          conversationId
        });
      } else {
        // Send via FCM (Firebase Cloud Messaging)
        const user = await this.prisma.users.findUnique({
          where: { id: participant.userId },
          select: { fcmToken: true }
        });

        if (user?.fcmToken) {
          await this.notifications.sendPushNotification(
            user.fcmToken,
            `New message from ${message.sender.name}`,
            message.content,
            { conversationId, messageId: message.id }
          );
        }
      }
    }
  }
}

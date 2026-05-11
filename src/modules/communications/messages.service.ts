import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StartConversationDto, CreateMessageDto } from './dto/message.dto';
import { UserRole, ConversationStatus, ConversationType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('message-delivery') private deliveryQueue: Queue,
  ) {}

  async startConversation(dto: StartConversationDto, currentUser: any) {
    const participantIds = Array.from(new Set([...dto.participantIds, currentUser.id]));

    // Check if direct conversation already exists
    if (dto.type === 'DIRECT' && participantIds.length === 2) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: { every: { userId: { in: participantIds } } }
        },
        include: { participants: true }
      });
      if (existing && existing.participants.length === 2) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type: dto.type || 'DIRECT',
        School_id: currentUser.School_id,
        participants: {
          create: participantIds.map(userId => ({ userId }))
        }
      },
      include: { participants: true }
    });
  }

  async createAssignmentGroup(assignmentId: string, sectionId: string, teacherId: string, schoolId: string) {
    const students = await this.prisma.students.findMany({
      where: { section_id: sectionId },
      select: { users_id: true }
    });

    const participantIds = [teacherId, ...students.map(s => s.users_id)];

    return this.prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        School_id: schoolId,
        assignmentId,
        sectionId,
        participants: {
          create: participantIds.map(userId => ({ userId }))
        }
      }
    });
  }

  async createSubjectGroup(subjectId: string, sectionId: string, teacherId: string, schoolId: string) {
    const students = await this.prisma.students.findMany({
      where: { section_id: sectionId },
      select: { users_id: true }
    });

    const participantIds = [teacherId, ...students.map(s => s.users_id)];

    return this.prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        School_id: schoolId,
        subjectId,
        sectionId,
        participants: {
          create: participantIds.map(userId => ({ userId }))
        }
      }
    });
  }

  async archiveConversation(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.ARCHIVED }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async archiveExpiredAssignmentGroups() {
    const now = new Date();

    // Find all active assignment conversations where assignment dueDate is in the past
    const expiredConversations = await this.prisma.conversation.findMany({
      where: {
        type: ConversationType.GROUP,
        status: ConversationStatus.ACTIVE,
        assignmentId: { not: null },
      }
    });

    for (const conv of expiredConversations) {
      const assignment = await this.prisma.assigment.findUnique({
        where: { id: conv.assignmentId! }
      });

      if (assignment && assignment.dueDate && assignment.dueDate < now) {
        await this.archiveConversation(conv.id);
        console.log(`Archived conversation ${conv.id} for expired assignment ${assignment.id}`);
      }
    }
  }

  async sendMessage(dto: CreateMessageDto, currentUser: any) {
    // 1. Verify participant
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: currentUser.id
        }
      }
    });

    if (!isParticipant) throw new ForbiddenException('You are not a participant in this conversation.');

    // 2. Save Message
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: currentUser.id,
        content: dto.content,
      }
    });

    // 3. Add to BullMQ for broadcast
    await this.deliveryQueue.add('deliver', {
      messageId: message.id,
      conversationId: dto.conversationId,
      senderId: currentUser.id,
    });

    return message;
  }

  async getConversations(user: any) {
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);

    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.id } },
        // If not admin, only show ACTIVE conversations
        status: isAdmin ? undefined : ConversationStatus.ACTIVE
      },
      include: {
        participants: { include: { user: { select: { name: true, photoUrl: true, role: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getMessages(conversationId: string, userId: string) {
    // Verify participant
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    return this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { name: true, id: true } } },
      orderBy: { createdAt: 'asc' }
    });
  }
}

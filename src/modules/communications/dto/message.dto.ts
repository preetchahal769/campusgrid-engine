import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ConversationType } from '@prisma/client';

export class StartConversationDto {
  @IsEnum(ConversationType)
  @IsOptional()
  type?: ConversationType;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}

export class CreateMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  content: string;
}

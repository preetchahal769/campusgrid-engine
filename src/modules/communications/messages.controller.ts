import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StartConversationDto, CreateMessageDto } from './dto/message.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  startConversation(@Body() dto: StartConversationDto, @Request() req: AuthenticatedRequest) {
    return this.messagesService.startConversation(dto, req.user);
  }

  @Get('conversations')
  getConversations(@Request() req: AuthenticatedRequest) {
    return this.messagesService.getConversations(req.user);
  }

  @Post()
  sendMessage(@Body() dto: CreateMessageDto, @Request() req: AuthenticatedRequest) {
    return this.messagesService.sendMessage(dto, req.user);
  }

  @Get('conversations/:id/history')
  getHistory(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.messagesService.getMessages(id, req.user.id);
  }
}

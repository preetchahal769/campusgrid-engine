import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(private configService: ConfigService) {}

  handleConnection(client: Socket) {
    try {
      let token = client.handshake.auth?.token;
      
      if (!token) {
        console.log('[Socket] Connection rejected: No token provided.');
        client.disconnect();
        return;
      }

      // Handle "Bearer <token>" format if provided
      if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      const secret = this.configService.get('JWT_SECRET', 'super-secret-default');
      const decoded = jwt.verify(token, secret) as any;
      const userId = decoded.userId || decoded.sub;

      if (userId) {
        this.connectedUsers.set(userId, client.id);
        client.join(userId);
        console.log(`[Socket] User authenticated: ${userId}`);
      } else {
        console.log('[Socket] Connection rejected: Token missing user payload.');
        client.disconnect();
      }
    } catch (error) {
      console.log(`[Socket] Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`[Socket] User disconnected: ${userId}`);
        break;
      }
    }
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

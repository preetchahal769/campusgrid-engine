import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LastActiveInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.id) {
      // Fire and forget update
      this.prisma.users.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      }).catch(() => {}); // Ignore errors in this background task
    }

    return next.handle();
  }
}

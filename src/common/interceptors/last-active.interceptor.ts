import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../database/prisma.service';

const lastActiveCache = new Map<string, number>();

@Injectable()
export class LastActiveInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let request: any;
    try {
      const gqlCtx = GqlExecutionContext.create(context);
      request = gqlCtx.getContext().req;
    } catch {}
    if (!request) {
      request = context.switchToHttp().getRequest();
    }
    const user = request?.user;

    if (user && user.id) {
      const now = Date.now();
      const lastUpdated = lastActiveCache.get(user.id) || 0;
      if (now - lastUpdated > 60000) { // 1 minute throttle
        lastActiveCache.set(user.id, now);
        // Fire and forget update
        this.prisma.users.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        }).catch(() => {}); // Ignore errors in this background task
      }
    }

    return next.handle();
  }
}

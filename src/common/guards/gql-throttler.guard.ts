import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    if (ctx && ctx.req) {
      return { req: ctx.req, res: ctx.req.res };
    }
    const httpCtx = context.switchToHttp();
    return { req: httpCtx.getRequest(), res: httpCtx.getResponse() };
  }
}

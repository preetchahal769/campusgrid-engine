import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch(HttpException)
export class GqlHttpExceptionFilter implements GqlExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();
    
    // If it's a GraphQL request (context.req exists)
    if (context && context.req) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      
      const message = typeof response === 'string' 
        ? response 
        : (response as any).message || exception.message;

      throw new GraphQLError(message, {
        extensions: {
          code: this.getErrorCode(status),
          originalError: response,
          http: {
            status: status
          }
        }
      });
    }
    
    // Fallback for REST endpoints if any
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    
    if (response && response.status) {
      response.status(status).json(exception.getResponse());
    } else {
      return exception;
    }
  }
  
  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_USER_INPUT';
      case 401: return 'UNAUTHENTICATED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 429: return 'TOO_MANY_REQUESTS';
      case 500: return 'INTERNAL_SERVER_ERROR';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }
}

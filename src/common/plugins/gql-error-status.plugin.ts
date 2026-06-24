import { ApolloServerPlugin, GraphQLRequestContextWillSendResponse } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';

@Plugin()
export class GqlErrorStatusPlugin implements ApolloServerPlugin {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext: GraphQLRequestContextWillSendResponse<any>) {
        const { response, errors } = requestContext;
        if (errors && errors.length > 0) {
          const firstError = errors[0];
          const originalError = firstError.extensions?.originalError as any;
          
          let status = 500;
          if (originalError && originalError.statusCode) {
            status = originalError.statusCode;
          } else {
            const code = firstError.extensions?.code || '';
            const message = firstError.message || '';
            
            if (message === 'Unauthorized' || code === 'UNAUTHENTICATED' || message.toLowerCase().includes('unauthorized')) {
              status = 401;
            } else if (message === 'Forbidden' || code === 'FORBIDDEN' || message.toLowerCase().includes('forbidden')) {
              status = 403;
            } else if (message.toLowerCase().includes('not found') || code === 'NOT_FOUND') {
              status = 404;
            } else if (code === 'BAD_USER_INPUT' || message.toLowerCase().includes('validation') || message.toLowerCase().includes('bad request')) {
              status = 400;
            } else if (message.toLowerCase().includes('too many requests') || code === 'TOO_MANY_REQUESTS') {
              status = 429;
            }
          }
          
          if (response.http) {
            response.http.status = status;
          }
        }
      }
    };
  }
}

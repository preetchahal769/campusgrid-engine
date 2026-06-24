import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req || context.switchToHttp().getRequest();
    const user = req?.user;

    // Assuming `user` object attached by JWT strategy has a `role` property
    if (!user || !user.role) {
       return false;
    }

    // Super admin can theoretically do anything based on the requirements
    if (user.role === 'SUPER_ADMIN') {
        return true;
    }

    return requiredRoles.includes(user.role);
  }
}

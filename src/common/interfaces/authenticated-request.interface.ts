import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  School_id?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

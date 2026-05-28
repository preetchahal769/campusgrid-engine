import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId: string;
    action: string;
    module: string;
    severity?: any; // Using any for enum
    entityId?: string;
    details?: any;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        module: data.module,
        severity: data.severity || 'INFO',
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findAll(query: {
    module?: string;
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        module: query.module,
        userId: query.userId,
        action: query.action,
      },
      include: {
        user: { select: { name: true, email: true, role: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
      skip: query.offset || 0,
    });

    return logs.map(log => ({
      ...log,
      actorAvatar: log.user.photoUrl
    }));
  }
}

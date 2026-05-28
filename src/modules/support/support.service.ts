import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EscalationStatus, LogSeverity } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getUrgentEscalations() {
    return this.prisma.escalation.findMany({
      where: {
        OR: [
          { status: EscalationStatus.UNACKNOWLEDGED },
          { severity: LogSeverity.CRITICAL }
        ]
      },
      include: {
        school: { select: { name: true } }
      },
      orderBy: { reportedAt: 'desc' }
    }).then(items => items.map(item => ({
      id: item.id,
      schoolId: item.schoolId,
      schoolName: (item as any).school.name,
      severity: item.severity,
      title: item.title,
      reportedAt: item.reportedAt,
      status: item.status
    })));
  }

  async acknowledgeEscalation(id: string, adminId: string) {
    const escalation = await this.prisma.escalation.findUnique({
      where: { id }
    });

    if (!escalation) {
      throw new NotFoundException('Escalation not found');
    }

    return this.prisma.escalation.update({
      where: { id },
      data: {
        status: EscalationStatus.ACKNOWLEDGED,
        acknowledgedBy: adminId,
        acknowledgedAt: new Date()
      }
    }).then(updated => ({
      success: true,
      escalationId: updated.id,
      status: updated.status,
      acknowledgedBy: updated.acknowledgedBy
    }));
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTermDto, CreateEventDto } from './dto/calendar.dto';
import { EventType } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async createTerm(dto: CreateTermDto) {
    return this.prisma.academicTerm.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      }
    });
  }

  async findAllTerms(schoolId: string) {
    return this.prisma.academicTerm.findMany({
      where: { School_id: schoolId },
      orderBy: { startDate: 'desc' }
    });
  }

  async createEvent(dto: CreateEventDto) {
    return this.prisma.schoolEvent.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }
    });
  }

  async findAllEvents(schoolId: string, month?: number, year?: number) {
    const where: any = { School_id: schoolId };
    
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      where.startDate = { gte: startOfMonth, lte: endOfMonth };
    }

    return this.prisma.schoolEvent.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });
  }

  async isHoliday(schoolId: string, date: Date): Promise<boolean> {
    const event = await this.prisma.schoolEvent.findFirst({
      where: {
        School_id: schoolId,
        type: EventType.HOLIDAY,
        startDate: { lte: date },
        OR: [
          { endDate: { gte: date } },
          { endDate: null, startDate: date }
        ]
      }
    });
    return !!event;
  }
}

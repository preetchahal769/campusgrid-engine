import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudioRoomDto, UpdateStudioRoomDto } from './dto/studio-room.dto';

@Injectable()
export class StudiosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudioRoomDto) {
    return this.prisma.studioRooms.create({
      data: dto,
    });
  }

  async findAll(schoolId: string) {
    return this.prisma.studioRooms.findMany({
      where: { School_id: schoolId, deletedAt: null },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.studioRooms.findFirst({
      where: { id, deletedAt: null },
    });
    if (!room) throw new NotFoundException('Studio room not found');
    return room;
  }

  async update(id: string, dto: UpdateStudioRoomDto) {
    return this.prisma.studioRooms.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.studioRooms.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async calculateRequiredRooms(schoolId: string, lecturesPerClassPerWeek: number = 2) {
    const totalSections = await this.prisma.section.count({
      where: { grade: { School_id: schoolId } },
    });

    // Assuming 5 days a week and 8 lectures a day = 40 slots per room
    const slotsPerRoomPerWeek = 40; 
    const totalNeededSlots = totalSections * lecturesPerClassPerWeek;
    const roomsNeeded = Math.ceil(totalNeededSlots / slotsPerRoomPerWeek);

    return {
      totalSections,
      lecturesPerClassPerWeek,
      totalNeededSlots,
      slotsPerRoomPerWeek,
      roomsNeeded,
    };
  }

  async distributeStudioRooms(schoolId: string, lecturesPerClassPerWeek: number = 2) {
    const rooms = await this.prisma.studioRooms.findMany({
      where: { School_id: schoolId, deletedAt: null },
    });

    if (rooms.length === 0) {
      throw new BadRequestException('No studio rooms available in this school. Create rooms first.');
    }

    const sections = await this.prisma.section.findMany({
      where: { grade: { School_id: schoolId } },
      select: { id: true, name: true },
    });

    // Clear existing assignments for this school's timetable
    await this.prisma.timetable.updateMany({
      where: { teachersubjectsection: { section: { grade: { School_id: schoolId } } } },
      data: { studioRoomId: null },
    });

    const roomSlots: Record<string, Set<string>> = {}; // roomID -> "Day-Lec"
    rooms.forEach(r => roomSlots[r.id] = new Set());

    const assignments: { id: string, studioRoomId: string }[] = [];

    for (const section of sections) {
      const timetableSlots = await this.prisma.timetable.findMany({
        where: { teachersubjectsection: { section_id: section.id } },
        orderBy: { dayOfWeek: 'asc' },
      });

      let assignedCount = 0;
      for (const slot of timetableSlots) {
        if (assignedCount >= lecturesPerClassPerWeek) break;

        // Find an available room for this slot (day + lectureNo)
        const slotKey = `${slot.dayOfWeek}-${slot.lectureNo}`;
        const availableRoom = rooms.find(r => !roomSlots[r.id].has(slotKey));

        if (availableRoom) {
          roomSlots[availableRoom.id].add(slotKey);
          assignments.push({ id: slot.id, studioRoomId: availableRoom.id });
          assignedCount++;
        }
      }
    }

    // Bulk update (Prisma doesn't have bulk update for different IDs easily, so we use a transaction or loop)
    // For large datasets, a transaction with multiple updates is safer.
    await this.prisma.$transaction(
      assignments.map(a => this.prisma.timetable.update({
        where: { id: a.id },
        data: { studioRoomId: a.studioRoomId },
      }))
    );

    return {
      message: `Distributed studio rooms across ${assignments.length} timetable slots.`,
      assignedSlots: assignments.length,
    };
  }
}

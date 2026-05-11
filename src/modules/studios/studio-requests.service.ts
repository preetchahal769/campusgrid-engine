import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSwapRequestDto, RespondSwapRequestDto } from './dto/swap-request.dto';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class StudioRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSwapRequestDto, currentUserId: string) {
    const teacher = await this.prisma.teachers.findFirst({
      where: { users_id: currentUserId }
    });
    if (!teacher) throw new ForbiddenException('Only teachers can create swap requests');

    const fromSlot = await this.prisma.timetable.findUnique({
      where: { id: dto.fromTimetableId },
      include: { teachersubjectsection: true }
    });

    if (!fromSlot) throw new NotFoundException('Source timetable slot not found');
    if (fromSlot.teachersubjectsection.teachers_id !== teacher.id) {
      throw new ForbiddenException('You do not own this timetable slot');
    }
    if (!fromSlot.studioRoomId) {
      throw new BadRequestException('Source slot does not have a studio room assigned');
    }

    if (dto.toTimetableId) {
      const toSlot = await this.prisma.timetable.findUnique({
        where: { id: dto.toTimetableId },
        include: { teachersubjectsection: true }
      });
      if (!toSlot) throw new NotFoundException('Target timetable slot not found');
      if (toSlot.lectureNo !== fromSlot.lectureNo) {
        throw new BadRequestException('Swaps are only allowed for the same lecture number');
      }
      if (toSlot.teachersubjectsection.teachers_id !== dto.toTeacherId) {
        throw new BadRequestException('Target slot does not belong to the target teacher');
      }
    }

    return this.prisma.studioRoomSwapRequest.create({
      data: {
        fromTimetableId: dto.fromTimetableId,
        toTimetableId: dto.toTimetableId,
        fromTeacherId: teacher.id,
        toTeacherId: dto.toTeacherId,
        status: RequestStatus.PENDING,
      }
    });
  }

  async findAllForTeacher(currentUserId: string) {
    const teacher = await this.prisma.teachers.findFirst({
      where: { users_id: currentUserId }
    });
    if (!teacher) throw new ForbiddenException('Only teachers can view requests');

    return this.prisma.studioRoomSwapRequest.findMany({
      where: {
        OR: [
          { fromTeacherId: teacher.id },
          { toTeacherId: teacher.id }
        ]
      },
      include: {
        fromTeacher: { include: { users: { select: { name: true } } } },
        toTeacher: { include: { users: { select: { name: true } } } },
        fromTimetable: true,
        toTimetable: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async respond(id: string, dto: RespondSwapRequestDto, currentUserId: string) {
    const request = await this.prisma.studioRoomSwapRequest.findUnique({
      where: { id },
      include: {
        fromTimetable: true,
        toTimetable: true,
        toTeacher: true,
      }
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.toTeacher.users_id !== currentUserId) {
      throw new ForbiddenException('Only the target teacher can respond to this request');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is already processed');
    }

    if (dto.status === 'REJECTED') {
      return this.prisma.studioRoomSwapRequest.update({
        where: { id },
        data: { status: RequestStatus.REJECTED }
      });
    }

    // APPROVED: Swap the rooms
    return this.prisma.$transaction(async (tx) => {
      const fromRoomId = request.fromTimetable.studioRoomId;
      const toRoomId = request.toTimetable?.studioRoomId || null;

      // Update fromTimetable to have toRoomId
      await tx.timetable.update({
        where: { id: request.fromTimetableId },
        data: { studioRoomId: toRoomId }
      });

      // Update toTimetable to have fromRoomId
      if (request.toTimetableId) {
        await tx.timetable.update({
          where: { id: request.toTimetableId },
          data: { studioRoomId: fromRoomId }
        });
      }

      return tx.studioRoomSwapRequest.update({
        where: { id },
        data: { status: RequestStatus.APPROVED }
      });
    });
  }
}

import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { ParentSubmitDto, DriverAssignDto } from './dto/route.dto';
import { RouteStatus } from '@prisma/client';

@Injectable()
export class RouteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async parentSubmit(dto: ParentSubmitDto, user: any) {
    try {
      const updatedStudent = await this.prisma.students.update({
        where: { id: dto.student_id },
        data: {
          student_home_location: { lat: dto.home_lat, lng: dto.home_lng },
          route_status: RouteStatus.PENDING_DRIVER,
        },
      });

      // Mock Event queue dispatch for driver console live update
      const eventPayload = JSON.stringify({
        event: 'PARENT_GEOLOCATION_SUBMITTED',
        studentId: dto.student_id,
        coordinates: { lat: dto.home_lat, lng: dto.home_lng }
      });
      await this.redis.set(`route_event:student:${dto.student_id}`, eventPayload, 3600);

      return {
        success: true,
        message: 'Home location submitted. Awaiting official bus stop confirmation from the driver.',
        data: {
          studentId: updatedStudent.id,
          routeStatus: updatedStudent.route_status,
          homeLocation: updatedStudent.student_home_location
        }
      };
    } catch (error: any) {
      throw new BadRequestException('Failed to submit parent home location: ' + error.message);
    }
  }

  async driverAssign(dto: DriverAssignDto, user: any) {
    try {
      const updatedStudent = await this.prisma.students.update({
        where: { id: dto.student_id },
        data: {
          assigned_stop_location: { lat: dto.stop_lat, lng: dto.stop_lng },
          stop_name: dto.stop_name,
          route_status: RouteStatus.ROUTE_LOCKED,
        },
        include: {
          users: { select: { name: true } }
        }
      });

      // Pushing notification to Valkey Redis Queue
      const brokerPayload = JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'BUS_STOP_ALLOCATED',
        data: {
          studentId: updatedStudent.id,
          studentName: updatedStudent.users.name,
          stopName: updatedStudent.stop_name,
          coordinates: updatedStudent.assigned_stop_location
        }
      });
      await this.redis.lpush('notification:parent:bus_stops', brokerPayload);

      return {
        success: true,
        message: 'Bus stop successfully assigned and route locked. Parents notified.',
        data: {
          studentId: updatedStudent.id,
          routeStatus: updatedStudent.route_status,
          assignedStop: updatedStudent.assigned_stop_location,
          stopName: updatedStudent.stop_name
        }
      };
    } catch (error: any) {
      throw new BadRequestException('Failed to assign driver stop: ' + error.message);
    }
  }
}

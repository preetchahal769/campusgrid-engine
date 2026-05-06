import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBroadcastDto, TargetType } from './dto/create-broadcast.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class BroadcastsService {
  constructor(private prisma: PrismaService) {}

  async create(createBroadcastDto: CreateBroadcastDto, currentUser: any) {
    const { title, message, target, attachments } = createBroadcastDto;

    // Serialize target
    let targetrole = '';
    if (target.type === TargetType.ALL) {
      targetrole = 'ALL';
    } else if (target.type === TargetType.ROLE) {
      targetrole = `ROLE:${target.role}`;
    } else if (target.type === TargetType.CLASS) {
      if (!target.classIds || target.classIds.length === 0) {
        throw new ForbiddenException('classIds must be provided when targeting CLASS');
      }
      targetrole = `CLASS:${target.classIds.join(',')}`;
    } else if (target.type === TargetType.SECTION) {
      if (!target.sectionId) {
        throw new ForbiddenException('sectionId must be provided when targeting SECTION');
      }
      targetrole = `SECTION:${target.sectionId}`;
    } else if (target.type === TargetType.USER) {
      if (!target.userIds || target.userIds.length === 0) {
        throw new ForbiddenException('userIds must be provided when targeting USER');
      }
      targetrole = `USER:${target.userIds.join(',')}`;
    }

    // Insert broadcast
    return this.prisma.broadcast.create({
      data: {
        title,
        message,
        targetrole,
        author_id: currentUser.id,
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map(att => ({
            filename: att.filename,
            filetype: att.filetype,
            fileurl: att.fileurl,
          }))
        } : undefined
      },
      include: {
        attachments: true
      }
    });
  }

  async fetchForUser(currentUser: any) {
    const orConditions: any[] = [
      { targetrole: 'ALL' },
      { targetrole: `ROLE:${currentUser.role}` },
      { targetrole: { startsWith: 'USER:', contains: currentUser.id } }
    ];

    if (currentUser.role === UserRole.STUDENT) {
      const studentProfile = await this.prisma.students.findFirst({
        where: { users_id: currentUser.id },
        include: { section: true }
      });
      
      if (studentProfile) {
        orConditions.push({ targetrole: `SECTION:${studentProfile.section_id}` });
        if (studentProfile.section && studentProfile.section.grade_id) {
          orConditions.push({ 
            targetrole: { 
              startsWith: 'CLASS:', 
              contains: studentProfile.section.grade_id 
            } 
          });
        }
      }
    }

    const whereClause: any = { OR: orConditions };

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('User must belong to a school to fetch broadcasts.');
      }
      whereClause.author = {
        School_id: currentUser.School_id
      };
    }

    return this.prisma.broadcast.findMany({
      where: whereClause,
      include: {
        attachments: true,
        author: {
          select: { name: true, role: true }
        }
      },
      orderBy: { id: 'desc' }
    });
  }
}

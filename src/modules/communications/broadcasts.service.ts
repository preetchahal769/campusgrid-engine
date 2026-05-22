import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBroadcastDto, TargetType } from './dto/create-broadcast.dto';
import { UserRole } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class BroadcastsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(createBroadcastDto: CreateBroadcastDto, currentUser: AuthenticatedUser, files?: Express.Multer.File[]) {
    const { title, message, target, attachments } = createBroadcastDto;

    // 1. Determine Target (Restricted for Teachers/Principals)
    let targetrole = 'ALL';
    
    // Only Admin and Super Admin can specify a specific target (Role, Class, Section, etc.)
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN) {
      if (target) {
        const t = typeof target === 'string' ? JSON.parse(target) : target;
        if (t.type === TargetType.ALL) {
          targetrole = 'ALL';
        } else if (t.type === TargetType.ROLE) {
          targetrole = `ROLE:${t.role}`;
        } else if (t.type === TargetType.CLASS) {
          targetrole = `CLASS:${t.classIds?.join(',')}`;
        } else if (t.type === TargetType.SECTION) {
          targetrole = `SECTION:${t.sectionId}`;
        } else if (t.type === TargetType.USER) {
          targetrole = `USER:${t.userIds?.join(',')}`;
        }
      }
    }

    // 2. Handle File Uploads
    const dbAttachments: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const key = `broadcasts/${Date.now()}-${file.originalname}`;
        await this.storageService.uploadFile(key, file.buffer, file.mimetype);
        dbAttachments.push({
          filename: file.originalname,
          filetype: file.mimetype,
          fileurl: key,
        });
      }
    }

    // Add existing attachments if any (legacy or manual URLs)
    if (attachments && Array.isArray(attachments)) {
      dbAttachments.push(...attachments);
    }

    // 3. Insert broadcast
    return this.prisma.broadcast.create({
      data: {
        title,
        message,
        targetrole,
        author_id: currentUser.id,
        attachments: dbAttachments.length > 0 ? {
          create: dbAttachments
        } : undefined
      },
      include: {
        attachments: true,
        author: {
          select: { name: true, role: true, School_id: true }
        }
      }
    });
  }

  async fetchForUser(currentUser: AuthenticatedUser) {
    const orConditions: any[] = [
      { targetrole: 'ALL' },
      { targetrole: `ROLE:${currentUser.role}` },
      { targetrole: { contains: currentUser.id } } // Simplified for USER: containment
    ];

    if (currentUser.role === UserRole.STUDENT) {
      const studentProfile = await this.prisma.students.findFirst({
        where: { users_id: currentUser.id },
        include: { section: true }
      });
      
      if (studentProfile) {
        orConditions.push({ targetrole: `SECTION:${studentProfile.section_id}` });
        if (studentProfile.section?.grade_id) {
          orConditions.push({ 
            targetrole: { contains: studentProfile.section.grade_id } 
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
        OR: [
          { School_id: currentUser.School_id },
          { School_id: null }
        ]
      };
    }

    const broadcasts = await this.prisma.broadcast.findMany({
      where: whereClause,
      include: {
        attachments: true,
        author: {
          select: { name: true, role: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    // 4. Generate Presigned URLs for attachments
    for (const bc of broadcasts) {
      if (bc.attachments) {
        for (const att of bc.attachments) {
          // If fileurl is a key (no http), presign it
          if (att.fileurl && !att.fileurl.startsWith('http')) {
            att.fileurl = await this.storageService.getPresignedUrl(att.fileurl);
          }
        }
      }
    }

    return broadcasts;
  }

  async getTargetRoles(currentUser: AuthenticatedUser) {
    // Only Admin and Super Admin can select target roles.
    // Others (Teachers/Principals) send to the whole school by default.
    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      return [];
    }

    const allRoles = [
      { label: 'Principal', value: UserRole.PRINCIPAL },
      { label: 'Teacher', value: UserRole.TEACHER },
      { label: 'Admin', value: UserRole.ADMIN },
      { label: 'Student', value: UserRole.STUDENT },
      { label: 'Parent', value: UserRole.PARENT },
      { label: 'Management', value: UserRole.MANAGEMENT },
    ];

    return allRoles;
  }

  async findById(id: string, currentUser: AuthenticatedUser) {
    const broadcast = await this.prisma.broadcast.findUnique({
      where: { id },
      include: {
        attachments: true,
        author: { select: { name: true, role: true } }
      }
    });

    if (!broadcast) throw new NotFoundException('Broadcast not found');

    // Generate Presigned URLs
    if (broadcast.attachments) {
      for (const att of broadcast.attachments) {
        if (att.fileurl && !att.fileurl.startsWith('http')) {
          att.fileurl = await this.storageService.getPresignedUrl(att.fileurl);
        }
      }
    }

    return broadcast;
  }
}

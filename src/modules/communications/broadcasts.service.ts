import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBroadcastDto, TargetType } from './dto/create-broadcast.dto';
import { UserRole } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class BroadcastsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(createBroadcastDto: CreateBroadcastDto, currentUser: any, file?: Express.Multer.File) {
    const { title, message, target, attachments } = createBroadcastDto;

    // 1. Serialize target
    let targetrole = '';
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

    // 2. Handle File Upload
    const dbAttachments: any[] = [];
    if (file) {
      const key = `broadcasts/${Date.now()}-${file.originalname}`;
      await this.storageService.uploadFile(key, file.buffer, file.mimetype);
      dbAttachments.push({
        filename: file.originalname,
        filetype: file.mimetype,
        fileurl: key, // Store the key, not the full URL
      });
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
        attachments: true
      }
    });
  }

  async fetchForUser(currentUser: any) {
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

  getTargetRoles(currentUser: any) {
    const allRoles = [
      { label: 'Principal', value: UserRole.PRINCIPAL },
      { label: 'Teacher', value: UserRole.TEACHER },
      { label: 'Admin', value: UserRole.ADMIN },
      { label: 'Student', value: UserRole.STUDENT },
      { label: 'Parent', value: UserRole.PARENT },
      { label: 'Staff', value: UserRole.STAFF },
      { label: 'Management', value: UserRole.MANAGEMENT },
    ];

    if (currentUser.role === UserRole.TEACHER) {
      return allRoles.filter(role => 
        ([UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.ADMIN, UserRole.STUDENT, UserRole.PARENT] as UserRole[]).includes(role.value)
      );
    }

    // For Admin/Principal/Super Admin, return all except Super Admin
    return allRoles;
  }
}

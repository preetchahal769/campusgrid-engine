import { Injectable, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  // Define which roles can create which other roles
  private readonly roleCreationMap: Record<UserRole, UserRole[]> = {
    [UserRole.SUPER_ADMIN]: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.MANAGEMENT,
      UserRole.PRINCIPAL,
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
      UserRole.BURSAR,
      UserRole.LIBRARIAN,
      UserRole.ACADEMIC_COORDINATOR,
      UserRole.TRANSPORT_MANAGER,
    ],
    [UserRole.ADMIN]: [
      UserRole.MANAGEMENT,
      UserRole.PRINCIPAL,
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
      UserRole.BURSAR,
      UserRole.LIBRARIAN,
      UserRole.ACADEMIC_COORDINATOR,
      UserRole.TRANSPORT_MANAGER,
    ],
    [UserRole.MANAGEMENT]: [
      UserRole.PRINCIPAL,
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
      UserRole.BURSAR,
      UserRole.LIBRARIAN,
      UserRole.ACADEMIC_COORDINATOR,
      UserRole.TRANSPORT_MANAGER,
    ],
    [UserRole.PRINCIPAL]: [
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
      UserRole.BURSAR,
      UserRole.LIBRARIAN,
      UserRole.ACADEMIC_COORDINATOR,
      UserRole.TRANSPORT_MANAGER,
    ],
    [UserRole.TEACHER]: [
      UserRole.STUDENT,
      UserRole.PARENT,
    ],
    [UserRole.STAFF]: [],
    [UserRole.STUDENT]: [],
    [UserRole.PARENT]: [],
    [UserRole.BURSAR]: [],
    [UserRole.LIBRARIAN]: [],
    [UserRole.ACADEMIC_COORDINATOR]: [],
    [UserRole.TRANSPORT_MANAGER]: [],
  };

  async create(createUserDto: CreateUserDto, currentUser: AuthenticatedUser) {
    const { role: targetRole, email, password, name, phoneNo, School_id } = createUserDto;
    const currentRole = currentUser.role;

    // Check if the current user has permission to create a user with the target role
    const allowedRoles = this.roleCreationMap[currentRole] || [];
    if (!allowedRoles.includes(targetRole)) {
      throw new ForbiddenException(
        `Users with role ${currentRole} are not allowed to create users with role ${targetRole}.`,
      );
    }

    // Check if the email is already in use
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already in use.');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Enforce school ID boundaries
    let targetSchoolId = School_id;
    if (currentRole !== UserRole.SUPER_ADMIN) {
      targetSchoolId = currentUser.School_id;
    }

    // Create the user
    const newUser = await this.prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: targetRole,
        phoneNo,
        School_id: targetSchoolId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNo: true,
        School_id: true,
      },
    });

    return newUser;
  }

  async findUnassigned(role: UserRole, currentUser: AuthenticatedUser) {
    if (role !== UserRole.STUDENT && role !== UserRole.TEACHER) {
      throw new ConflictException('Only STUDENT or TEACHER roles are supported for unassigned filter.');
    }

    const whereClause: any = { role };

    // Enforce school scoping unless Super Admin
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to fetch unassigned users.');
      }
      whereClause.School_id = currentUser.School_id;
    }

    if (role === UserRole.STUDENT) {
      whereClause.students = { none: {} };
    } else if (role === UserRole.TEACHER) {
      whereClause.OR = [
        { teachers: { none: {} } },
        { teachers: { some: { teachersubjectsection: { none: {} } } } }
      ];
    }

    return this.prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        role: true,
        School_id: true,
      },
    });
  }

  async updateProfile(currentUser: AuthenticatedUser, updateDto: any) {
    const existingUser = await this.prisma.users.findUnique({ where: { id: currentUser.id } });
    if (!existingUser) throw new ForbiddenException('User not found');

    const isFirstTimePhone = !existingUser.phoneNo && updateDto.phoneNo;

    // If it's a first time phone entry, update directly but ALSO create a pending request
    if (isFirstTimePhone) {
      const user = await this.prisma.users.update({
        where: { id: currentUser.id },
        data: {
          phoneNo: updateDto.phoneNo,
        },
        select: {
          id: true, name: true, email: true, phoneNo: true, role: true, photoUrl: true,
        },
      });

      if (currentUser.School_id) {
        await this.prisma.profileChangeRequest.create({
          data: {
            userId: currentUser.id,
            School_id: currentUser.School_id,
            requestedPhoneNo: updateDto.phoneNo,
            status: 'PENDING',
          }
        });
      }

      if (user.photoUrl && !user.photoUrl.startsWith('http')) {
        user.photoUrl = await this.storageService.getPresignedUrl(user.photoUrl);
      }
      return user;
    }

    // Otherwise, it's a regular update. Intercept it for approval if they have a school.
    if (currentUser.School_id && (updateDto.name || updateDto.phoneNo)) {
      await this.prisma.profileChangeRequest.create({
        data: {
          userId: currentUser.id,
          School_id: currentUser.School_id,
          requestedName: updateDto.name !== existingUser.name ? updateDto.name : undefined,
          requestedPhoneNo: updateDto.phoneNo !== existingUser.phoneNo ? updateDto.phoneNo : undefined,
          status: 'PENDING',
        }
      });

      // Return the original user without changes since it's pending
      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        phoneNo: existingUser.phoneNo,
        role: existingUser.role,
        photoUrl: existingUser.photoUrl && !existingUser.photoUrl.startsWith('http') 
          ? await this.storageService.getPresignedUrl(existingUser.photoUrl) 
          : existingUser.photoUrl,
        pendingApproval: true
      };
    }

    // For Super Admins or users without a school, just update directly
    const user = await this.prisma.users.update({
      where: { id: currentUser.id },
      data: {
        name: updateDto.name,
        phoneNo: updateDto.phoneNo,
      },
      select: {
        id: true, name: true, email: true, phoneNo: true, role: true, photoUrl: true,
      },
    });

    if (user.photoUrl && !user.photoUrl.startsWith('http')) {
      user.photoUrl = await this.storageService.getPresignedUrl(user.photoUrl);
    }
    return user;
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    // 1. Get current user to see if they already have a photo
    const currentUser = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { photoUrl: true }
    });

    // 2. Delete old photo from Storage if it exists
    if (currentUser?.photoUrl) {
      try {
        await this.storageService.deleteFile(currentUser.photoUrl);
      } catch (error) {
        this.logger.error(`Failed to delete old profile photo: ${currentUser.photoUrl}`, error);
        // We continue anyway so the new upload isn't blocked
      }
    }

    // 3. Upload new photo
    const key = `profiles/${userId}-${Date.now()}-${file.originalname}`;
    await this.storageService.uploadFile(key, file.buffer, file.mimetype);
    
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { photoUrl: key },
      select: { id: true, photoUrl: true }
    });

    user.photoUrl = await this.storageService.getPresignedUrl(key);
    return user;
  }

  async updateFcmToken(userId: string, token: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { fcmToken: token }
    });
  }

  async searchInSchool(query: string, role: UserRole, currentUser: AuthenticatedUser) {
    if (!currentUser.School_id) return [];

    return this.prisma.users.findMany({
      where: {
        School_id: currentUser.School_id,
        role: role,
        name: { contains: query, mode: 'insensitive' },
        id: { not: currentUser.id } // Don't find yourself
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        role: true
      },
      take: 20
    });
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNo: true,
        photoUrl: true,
        School_id: true,
        School: {
          select: {
            name: true,
          }
        },
        parent: {
          include: {
            students: {
              include: {
                users: {
                  select: {
                    name: true,
                    photoUrl: true,
                  }
                },
                section: {
                  include: {
                    grade: true
                  }
                }
              }
            }
          }
        }
      },
    });

    if (user && user.photoUrl && !user.photoUrl.startsWith('http')) {
      user.photoUrl = await this.storageService.getPresignedUrl(user.photoUrl);
    }

    return user;
  }

  async findGlobalAdmins() {
    return this.prisma.users.findMany({
      where: {
        role: {
          in: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRINCIPAL]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        School: {
          select: {
            name: true
          }
        }
      }
    });
  }

  async resetPassword(userId: string, newPassword?: string) {
    const password = newPassword || 'Welcome@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, email: true, name: true }
    });
  }
}

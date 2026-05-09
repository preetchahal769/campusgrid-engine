import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  // Define which roles can create which other roles
  private readonly roleCreationMap: Record<UserRole, UserRole[]> = {
    [UserRole.SUPER_ADMIN]: [
      UserRole.ADMIN,
      UserRole.MANAGEMENT,
      UserRole.PRINCIPAL,
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
    ],
    [UserRole.ADMIN]: [
      UserRole.MANAGEMENT,
      UserRole.PRINCIPAL,
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
    ],
    [UserRole.MANAGEMENT]: [
      UserRole.PRINCIPAL,
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
    ],
    [UserRole.PRINCIPAL]: [
      UserRole.TEACHER,
      UserRole.STAFF,
      UserRole.STUDENT,
      UserRole.PARENT,
    ],
    [UserRole.TEACHER]: [
      UserRole.STUDENT,
      UserRole.PARENT,
    ],
    [UserRole.STAFF]: [],
    [UserRole.STUDENT]: [],
    [UserRole.PARENT]: [],
  };

  async create(createUserDto: CreateUserDto, currentUser: any) {
    const { role: targetRole, email, password, name, phoneNo, School_id } = createUserDto;
    const currentRole = currentUser.role as UserRole;

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

  async findUnassigned(role: UserRole, currentUser: any) {
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

  async updateProfile(userId: string, updateDto: any) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: {
        name: updateDto.name,
        phoneNo: updateDto.phoneNo,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        role: true,
        photoUrl: true,
      },
    });

    if (user.photoUrl && !user.photoUrl.startsWith('http')) {
      user.photoUrl = await this.storageService.getPresignedUrl(user.photoUrl);
    }

    return user;
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
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
        }
      },
    });

    if (user && user.photoUrl && !user.photoUrl.startsWith('http')) {
      user.photoUrl = await this.storageService.getPresignedUrl(user.photoUrl);
    }

    return user;
  }
}

import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSchoolDto, CreateSchoolWithPrincipalDto } from './dto/create-school.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SchoolsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateSchoolDto, currentUser: any) {
    const school = await this.prisma.school.create({
      data: {
        name: dto.name,
        city: dto.city,
        pincode: dto.pincode,
        education_board: dto.education_board,
        subscriptionRate: (dto as any).subscriptionRate || 80,
      } as any,
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'CREATE',
      module: 'SCHOOLS',
      entityId: school.id,
      details: { name: school.name }
    });

    return school;
  }

  async findAll() {
    return this.prisma.school.findMany({
      include: {
        _count: {
          select: { users: true, grade: true }
        }
      }
    });
  }

  async createWithPrincipal(dto: CreateSchoolWithPrincipalDto) {
    const { school, principal } = dto;

    // Check if user already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email: principal.email }
    });
    if (existingUser) {
      throw new ConflictException('Email is already in use by another user.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create School
      const newSchool = await tx.school.create({
        data: {
          name: school.name,
          city: school.city,
          pincode: school.pincode,
          education_board: school.education_board,
          subscriptionRate: (school as any).subscriptionRate || 80,
        } as any,
      });

      // 2. Create User for Principal
      const hashedPassword = await bcrypt.hash(principal.password || 'Welcome@123', 10);
      const newUser = await tx.users.create({
        data: {
          email: principal.email,
          password: hashedPassword,
          name: principal.name,
          phoneNo: principal.phoneNo,
          role: UserRole.PRINCIPAL,
          School_id: newSchool.id,
        },
      });

      // 3. Create Principal Profile
      const newProfile = await tx.principal.create({
        data: {
          users_id: newUser.id,
          School_id: newSchool.id,
          qualification: principal.qualification,
          experinceYear: principal.experienceYears,
          joiningDate: new Date(),
        },
      });

      return {
        school: newSchool,
        principal: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
          profile: newProfile,
        }
      };
    });
  }

  async update(id: string, dto: any, currentUser: any) {
    const school = await this.prisma.school.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'UPDATE',
      module: 'SCHOOLS',
      entityId: id,
      details: dto
    });

    return school;
  }

  async remove(id: string, currentUser: any) {
    // Soft delete by setting status to DELETED
    const school = await this.prisma.school.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'DELETE',
      module: 'SCHOOLS',
      entityId: id,
    });

    return school;
  }
}

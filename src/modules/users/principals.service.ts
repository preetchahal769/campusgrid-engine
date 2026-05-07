import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePrincipalProfileDto } from './dto/create-principal-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PrincipalsService {
  constructor(private prisma: PrismaService) {}

  async createProfile(createPrincipalProfileDto: CreatePrincipalProfileDto, currentUser: any) {
    const { users_id, ...rest } = createPrincipalProfileDto;
    let targetSchoolId = createPrincipalProfileDto.School_id;

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!currentUser.School_id) {
        throw new ForbiddenException('You must be associated with a school to create principal profiles.');
      }
      targetSchoolId = currentUser.School_id;
    } else if (!targetSchoolId) {
      throw new ForbiddenException('Super Admin must provide a School_id.');
    }

    const user = await this.prisma.users.findUnique({ where: { id: users_id } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role !== UserRole.PRINCIPAL) throw new ConflictException('User is not a principal.');

    const existingProfile = await this.prisma.principal.findFirst({
      where: { users_id },
    });

    if (existingProfile) {
      throw new ConflictException('Principal profile already exists.');
    }

    return this.prisma.principal.create({
      data: {
        users_id,
        School_id: targetSchoolId as string,
        qualification: rest.qualification,
        experinceYear: rest.experinceYear,
        joiningDate: rest.joiningDate ? new Date(rest.joiningDate) : undefined,
        signatureUrl: rest.signatureUrl,
      },
    });
  }

  async findMyProfile(currentUser: any) {
    const profile = await this.prisma.principal.findFirst({
      where: { users_id: currentUser.id },
      include: {
        users: { select: { name: true, email: true, phoneNo: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Principal profile not found.');
    }

    return profile;
  }
}

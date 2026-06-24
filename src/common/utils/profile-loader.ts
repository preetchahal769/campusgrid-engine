import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';

export async function getOrLoadStudentProfile(
  prisma: PrismaService,
  currentUser: AuthenticatedUser
) {
  const userWithCache = currentUser as any;
  if (!userWithCache.studentProfilePromise) {
    userWithCache.studentProfilePromise = prisma.students.findFirst({
      where: { users_id: currentUser.id, status: 'ACTIVE' },
      include: {
        users: { select: { id: true, name: true, email: true, phoneNo: true, role: true, globalRating: true, globalRank: true } },
        section: {
          include: { grade: true }
        }
      }
    });
  }
  return userWithCache.studentProfilePromise;
}

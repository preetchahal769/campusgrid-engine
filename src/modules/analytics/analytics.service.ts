import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Recalculates the global rating for a user across all their student profiles.
   * Rating is currently based on the average percentage across all submissions.
   */
  async recalculateGlobalRating(userId: string) {
    // 1. Get all student profiles (Active and Transferred) for this user
    const studentProfiles = await this.prisma.students.findMany({
      where: { users_id: userId },
      select: { id: true }
    });

    const profileIds = studentProfiles.map(p => p.id);
    if (profileIds.length === 0) return 0;

    // 2. Get all submissions for these profiles
    const submissions = await this.prisma.submission.findMany({
      where: { 
        students_id: { in: profileIds },
        obatinedmarks: { not: null }
      },
      include: {
        assigment: { select: { maxMarks: true } }
      }
    });

    if (submissions.length === 0) return 0;

    // 3. Calculate average percentage
    let totalPercentage = 0;
    let count = 0;

    for (const sub of submissions) {
      if (sub.assigment.maxMarks && sub.assigment.maxMarks > 0) {
        const percentage = (sub.obatinedmarks! / sub.assigment.maxMarks) * 100;
        totalPercentage += percentage;
        count++;
      }
    }

    const finalRating = count > 0 ? totalPercentage / count : 0;

    // 4. Update the user record
    await this.prisma.users.update({
      where: { id: userId },
      data: { globalRating: finalRating }
    });

    // 5. Bonus: Recalculate Global Ranks (Optimized for small-medium datasets)
    await this.updateGlobalRanks();

    return finalRating;
  }

  private async updateGlobalRanks() {
    // Sort all students by rating descending
    const students = await this.prisma.users.findMany({
      where: { role: 'STUDENT' },
      orderBy: { globalRating: 'desc' },
      select: { id: true }
    });

    // Update ranks in bulk (one by one for simplicity in this version)
    for (let i = 0; i < students.length; i++) {
      await this.prisma.users.update({
        where: { id: students[i].id },
        data: { globalRank: i + 1 }
      });
    }
  }
}

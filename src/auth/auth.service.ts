import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../database/redis.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.password || '');
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.role);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async issueTokens(userId: string, role: string) {
    const payload = { userId, role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    // Store refresh token in Redis (Expires in 7 days)
    const ttl = 7 * 24 * 60 * 60;
    await this.redisService.set(`rt:${userId}:${refreshToken}`, '1', ttl);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refreshTokens(oldRefreshToken: string) {
    // 1. Find the token in Redis to get the userId
    const keys = await this.redisService.keys(`rt:*:${oldRefreshToken}`);
    if (keys.length === 0) {
      // REUSE DETECTION: If token not found but it's a valid format, 
      // maybe it was used before. For simplicity, we search for ANY RT for the userId 
      // if we could extract it. But since RT is just a UUID, we can't extract userId without a map.
      // So if it's not found, we just reject. 
      // A more robust way is to store 'used' tokens in Redis for a short while.
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const key = keys[0];
    const userId = key.split(':')[1];

    // 2. Delete the old token (Rotation)
    await this.redisService.del(key);

    // 3. Get user details
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    // 4. Issue new pair
    return this.issueTokens(user.id, user.role);
  }

  async logout(userId: string, refreshToken: string) {
    await this.redisService.del(`rt:${userId}:${refreshToken}`);
  }

  async logoutAll(userId: string) {
    await this.redisService.delAll(`rt:${userId}:*`);
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(oldPass, user.password || '');
    if (!isMatch) throw new UnauthorizedException('Incorrect old password');

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal if user exists or not
      return { message: 'If this email is registered, you will receive a reset link.' };
    }

    // In a real app, generate token and send email here
    return { message: 'If this email is registered, you will receive a reset link.' };
  }
}

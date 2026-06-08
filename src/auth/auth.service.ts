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

    // 2. Fetch the value. If it's not '1', it means it was already rotated recently
    // and this is a concurrent request (e.g., from a second browser tab).
    // In that case, we return the cached new tokens!
    const value = await this.redisService.get(key);
    if (value && value !== '1') {
      return JSON.parse(value);
    }

    // 3. Get user details
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    // 4. Issue new pair
    const newTokens = await this.issueTokens(user.id, user.role);

    // 5. Instead of deleting the old token immediately, we store the new tokens
    // under the old token's key with a short 60-second TTL. This acts as a "Grace Period"
    // to satisfy any concurrent refresh requests from other tabs!
    await this.redisService.set(key, JSON.stringify(newTokens), 60);

    return newTokens;
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

  async getDebugInfo(userId: string, refreshToken: string | undefined, accessToken: string | undefined) {
    let refreshTokenTtl = -1;
    if (refreshToken) {
      refreshTokenTtl = await this.redisService.ttl(`rt:${userId}:${refreshToken}`);
    }

    let accessTokenTtl = -1;
    let rawJwt = null;
    if (accessToken) {
      try {
        const decoded: any = this.jwtService.decode(accessToken);
        rawJwt = decoded;
        if (decoded && decoded.exp) {
          accessTokenTtl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
        }
      } catch (e) {
        // invalid token
      }
    }

    let dbStatus = 'ok';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch (e) {
      dbStatus = 'error';
    }

    return {
      environment: process.env.NODE_ENV || 'development',
      accessTokenTtl,
      refreshTokenTtl,
      rawJwt,
      backendHealth: {
        db: dbStatus,
        dbLatencyMs: dbLatency,
      }
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as os from 'os';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const uptime = process.uptime();
    const cpuUsage = os.loadavg()[0]; // 1 min load average
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Check DB connection
    let dbStatus = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'critical',
      uptimeSeconds: Math.floor(uptime),
      cpu: {
        usagePercent: parseFloat(((cpuUsage / os.cpus().length) * 100).toFixed(2)),
        cores: os.cpus().length
      },
      memory: {
        totalGB: parseFloat((totalMem / 1024 / 1024 / 1024).toFixed(2)),
        usedGB: parseFloat((usedMem / 1024 / 1024 / 1024).toFixed(2)),
        usagePercent: parseFloat(((usedMem / totalMem) * 100).toFixed(2))
      },
      database: {
        status: dbStatus,
        activeConnections: Math.floor(Math.random() * 50) + 10 // Mocking connection count
      },
      redis: {
        status: 'connected',
        hitRatePercent: 98.5
      }
    };
  }

  async getStorageUsage() {
    // Get DB size (PostgreSQL specific)
    const dbSizeResult: any[] = await this.prisma.$queryRaw`SELECT pg_database_size(current_database())`;
    const dbSizeInBytes = Number(dbSizeResult[0].pg_database_size);
    const dbSizeGB = parseFloat((dbSizeInBytes / 1024 / 1024 / 1024).toFixed(2));

    // Mocking asset storage (e.g., S3/MinIO)
    const assetsUsedGB = 730.0;
    const totalUsedGB = dbSizeGB + assetsUsedGB;
    const totalAllocatedTB = 5.0;
    const totalAllocatedGB = totalAllocatedTB * 1024;

    return {
      totalAllocatedTB,
      totalUsedGB: parseFloat(totalUsedGB.toFixed(2)),
      databaseUsedGB: dbSizeGB,
      assetsUsedGB,
      usagePercent: parseFloat(((totalUsedGB / totalAllocatedGB) * 100).toFixed(2))
    };
  }
}

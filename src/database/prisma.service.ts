import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      adapter: new PrismaPg(
        new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 30, // Optimized connection pool limits for Hostinger KVM memory overhead
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        })
      )
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

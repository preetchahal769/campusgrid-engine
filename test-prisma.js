require('ts-node/register');
require('dotenv').config();
const { PrismaService } = require('./src/database/prisma.service.ts');

async function test() {
  console.log("DATABASE_URL is:", process.env.DATABASE_URL);
  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    console.log("Connected successfully!");
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();

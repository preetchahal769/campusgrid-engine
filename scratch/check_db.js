const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.schoolSubscription.count();
  console.log('Current Subscription Count:', count);
  const schools = await prisma.school.count();
  console.log('Total Schools:', schools);
}

main().catch(console.error).finally(() => prisma.$disconnect());

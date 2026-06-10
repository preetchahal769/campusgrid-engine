const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.$queryRaw`SELECT typname FROM pg_type WHERE typname = 'BugReportStatus'`;
  console.log(types);
}
main().catch(console.error).finally(() => prisma.$disconnect());

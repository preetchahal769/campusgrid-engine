import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding database...');

  // 1. Company Accounts (No School Association)
  const superAdmin = await prisma.users.upsert({
    where: { email: 'superadmin@campusgrid.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@campusgrid.com',
      password,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super Admin ensured:', superAdmin.email);

  const companyAdmin = await prisma.users.upsert({
    where: { email: 'admin@campusgrid.com' },
    update: {},
    create: {
      name: 'Company Admin',
      email: 'admin@campusgrid.com',
      password,
      role: 'ADMIN',
    },
  });
  console.log('Company Admin ensured:', companyAdmin.email);

  // 2. School Infrastructure
  let school = await prisma.school.findFirst({ where: { name: 'Greenwood High' } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Greenwood High',
        city: 'New York',
        pincode: 10001,
        education_board: 'CBSE',
      },
    });
  }
  console.log('School ensured:', school.name);

  let grade = await prisma.grade.findFirst({ where: { name: '10th Grade', School_id: school.id } });
  if (!grade) {
    grade = await prisma.grade.create({
      data: {
        name: '10th Grade',
        School_id: school.id,
      },
    });
  }

  let section = await prisma.section.findFirst({ where: { name: 'Section A', grade_id: grade.id } });
  if (!section) {
    section = await prisma.section.create({
      data: {
        name: 'Section A',
        grade_id: grade.id,
      },
    });
  }

  // 3. School-Associated Accounts
  // Principal
  let principalUser = await prisma.users.findUnique({ where: { email: 'principal@greenwood.edu' } });
  if (!principalUser) {
    principalUser = await prisma.users.create({
      data: {
        name: 'Principal Smith',
        email: 'principal@greenwood.edu',
        password,
        role: 'PRINCIPAL',
        School_id: school.id,
        principal: {
          create: {
            School_id: school.id,
          }
        }
      },
    });
  }
  console.log('Principal ensured:', principalUser.email);

  // Teachers
  for (let i = 1; i <= 3; i++) {
    const teacherEmail = `teacher${i}@greenwood.edu`;
    let teacherUser = await prisma.users.findUnique({ where: { email: teacherEmail } });
    if (!teacherUser) {
      teacherUser = await prisma.users.create({
        data: {
          name: `Teacher ${i}`,
          email: teacherEmail,
          password,
          role: 'TEACHER',
          School_id: school.id,
          teachers: {
            create: {
              School_id: school.id,
            }
          }
        },
      });
      console.log(`Teacher ${i} created:`, teacherUser.email);
    }
  }

  // Students
  for (let i = 1; i <= 5; i++) {
    const studentEmail = `student${i}@greenwood.edu`;
    let studentUser = await prisma.users.findUnique({ where: { email: studentEmail } });
    if (!studentUser) {
      studentUser = await prisma.users.create({
        data: {
          name: `Student ${i}`,
          email: studentEmail,
          password,
          role: 'STUDENT',
          School_id: school.id,
          students: {
            create: {
              School_id: school.id,
              section_id: section.id,
            }
          }
        },
      });
      console.log(`Student ${i} created:`, studentUser.email);
    }
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding database with Faker.js...');

  // 1. Core Global Admins (Keep static so we can log in)
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

  // 2. Generate 10 Schools
  for (let i = 0; i < 10; i++) {
    const schoolName = faker.company.name() + ' High School';
    // Random creation date between 1 and 12 months ago
    const schoolCreatedAt = faker.date.past({ years: 1 });
    
    const school = await prisma.school.create({
      data: {
        name: schoolName,
        city: faker.location.city(),
        pincode: parseInt(faker.location.zipCode('#####')),
        education_board: faker.helpers.arrayElement(['CBSE', 'ICSE', 'State Board']),
        subscriptionRate: faker.helpers.arrayElement([80, 100, 120]), // Custom rates
        createdAt: schoolCreatedAt,
      },
    });
    console.log(`Created School: ${school.name}`);

    // Generate Grades & Sections
    const grade = await prisma.grade.create({
      data: { name: '10th Grade', School_id: school.id },
    });
    const section = await prisma.section.create({
      data: { name: 'Section A', grade_id: grade.id },
    });

    // Generate Principal
    await prisma.users.create({
      data: {
        name: faker.person.fullName(),
        email: `principal.${school.id.slice(-8)}@campusgrid.com`,
        password,
        role: 'PRINCIPAL',
        School_id: school.id,
        createdAt: faker.date.between({ from: schoolCreatedAt, to: new Date() }),
        lastActiveAt: faker.date.recent({ days: 1 }), // Random recent activity
        principal: {
          create: { School_id: school.id }
        }
      },
    });

    // Generate 3 Teachers
    for (let t = 0; t < 3; t++) {
      await prisma.users.create({
        data: {
          name: faker.person.fullName(),
          email: `${t}_${school.id.slice(-5)}_${faker.internet.email()}`,
          password,
          role: 'TEACHER',
          School_id: school.id,
          createdAt: faker.date.between({ from: schoolCreatedAt, to: new Date() }),
          lastActiveAt: faker.date.recent({ days: 3 }),
          teachers: {
            create: { School_id: school.id }
          }
        },
      });
    }

    // Generate 50 Students (to make MRR realistic)
    for (let s = 0; s < 50; s++) {
      await prisma.users.create({
        data: {
          name: faker.person.fullName(),
          email: `${s}_${school.id.slice(-5)}_${faker.internet.email()}`,
          password,
          role: 'STUDENT',
          School_id: school.id,
          createdAt: faker.date.between({ from: schoolCreatedAt, to: new Date() }),
          lastActiveAt: faker.date.recent({ days: 7 }),
          students: {
            create: {
              School_id: school.id,
              section_id: section.id,
            }
          }
        },
      });
    }

    // Generate Subscriptions for this school for every month since it was created
    const startMonth = schoolCreatedAt.getMonth();
    const startYear = schoolCreatedAt.getFullYear();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const months: string[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      const firstMonth = y === startYear ? startMonth : 0;
      const lastMonth = y === currentYear ? currentMonth : 11;
      for (let m = firstMonth; m <= lastMonth; m++) {
        const monthStr = `${y}-${(m + 1).toString().padStart(2, '0')}`;
        months.push(monthStr);
      }
    }

    for (const month of months) {
      // 90% chance of being paid to make revenue look healthy
      const isPaid = faker.number.int({ min: 1, max: 100 }) <= 90;
      await prisma.schoolSubscription.create({
        data: {
          schoolId: school.id,
          month,
          studentCount: 50,
          ratePerStudent: school.subscriptionRate,
          amountDue: 50 * school.subscriptionRate,
          amountPaid: isPaid ? (50 * school.subscriptionRate) : 0,
          status: isPaid ? 'PAID' : 'PENDING',
          paidAt: isPaid ? faker.date.recent({ days: 15 }) : null,
          invoiceId: `INV-${month.replace('-', '')}-${school.id.substring(school.id.length - 4).toUpperCase()}`
        }
      });
    }
  }

  console.log('Database seeding with Faker completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

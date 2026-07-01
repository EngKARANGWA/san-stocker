import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PERMISSIONS } from '../src/common/constants/permissions.constant';

const prisma = new PrismaClient();

async function seedPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { module: permission.module, action: permission.action, description: permission.description },
      create: permission,
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions`);
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set - skipping Super Admin seed');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Super Admin already exists, skipping');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      tenantId: null,
      roleId: null,
      isSuperAdmin: true,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME ?? 'SAN',
      lastName: process.env.SUPER_ADMIN_LAST_NAME ?? 'TECH',
      email,
      phone: process.env.SUPER_ADMIN_PHONE,
      passwordHash,
    },
  });
  console.log(`Seeded Super Admin (SAN TECH) account: ${email}`);
}

async function main() {
  await seedPermissions();
  await seedSuperAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

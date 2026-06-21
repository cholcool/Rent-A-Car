import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the Prisma seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

function hashPassword(password: string) {
  const salt = randomBytes(8).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function isScryptHash(value: string | null | undefined) {
  if (!value) return false;
  const [algorithm, salt, hash] = value.split(':');
  return algorithm === 'scrypt' && Boolean(salt) && Boolean(hash);
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = scryptSync(password, salt, hashBuffer.length);
  return (
    hashBuffer.length === candidateBuffer.length && timingSafeEqual(hashBuffer, candidateBuffer)
  );
}

async function main() {
  const roleDefinitions = [
    { code: 'ADMIN', name: 'Admin', remark: 'Full system access' },
    { code: 'MANAGER', name: 'Manager', remark: 'Manage operations and reports' },
    { code: 'AGENT', name: 'Agent', remark: 'Manage bookings and customer workflows' },
    { code: 'VIEWER', name: 'Viewer', remark: 'Read-only system access' },
  ];

  for (const role of roleDefinitions) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        remark: role.remark,
        updatedBy: SYSTEM_USER_ID,
      },
      create: {
        ...role,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      },
    });
  }

  const permissions = [
    { code: 'cars.view', name: 'View cars', remark: 'Read car inventory' },
    { code: 'cars.manage', name: 'Manage cars', remark: 'Create and update car inventory' },
    { code: 'bookings.view', name: 'View bookings', remark: 'Read bookings' },
    { code: 'bookings.manage', name: 'Manage bookings', remark: 'Create and update bookings' },
    { code: 'payments.view', name: 'View payments', remark: 'Read payment records' },
    { code: 'users.manage', name: 'Manage users', remark: 'Create and update users and roles' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        remark: permission.remark,
        updatedBy: SYSTEM_USER_ID,
      },
      create: {
        ...permission,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminUserName = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin';
  const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin';
  const adminLastName = process.env.SEED_ADMIN_LAST_NAME ?? 'User';
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '0000000000';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const shouldUpdatePassword =
    !existingAdmin?.hashedPassword ||
    !isScryptHash(existingAdmin.hashedPassword) ||
    verifyPassword('admin', existingAdmin.hashedPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      userName: adminUserName,
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: adminPhone,
      hashedPassword: shouldUpdatePassword
        ? hashPassword(adminPassword)
        : existingAdmin.hashedPassword,
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      email: adminEmail,
      userName: adminUserName,
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: adminPhone,
      hashedPassword: hashPassword(adminPassword),
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });

  if (adminRole) {
    const existingUserRole = await prisma.userRole.findFirst({
      where: { userId: admin.id, roleId: adminRole.id },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: adminRole.id,
          createdBy: SYSTEM_USER_ID,
        },
      });
    }
  }

  console.log(`Seed finished. Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

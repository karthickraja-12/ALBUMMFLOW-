const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Full Database Wipe...');

  try {
    // We use a transaction to ensure all or nothing
    await prisma.$transaction([
      // Use raw SQL to truncate all tables and reset identities
      // Order matters if not using CASCADE, but TRUNCATE ... CASCADE is safest
      prisma.$executeRaw`TRUNCATE TABLE "Selection" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Photo" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Event" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Session" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Account" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "VerificationToken" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "MonitoringLog" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`,
    ]);

    console.log('✅ Database Wiped Successfully!');
    console.log('👉 ACTION REQUIRED: Log into the app now with your Google account.');
  } catch (error) {
    console.error('❌ Error wiping database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

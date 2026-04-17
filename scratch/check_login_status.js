const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const email = 'karthickraja8703@gmail.com';
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    console.log('User Status:');
    if (!user) {
      console.log('MISSING: User does not exist in the database.');
    } else {
      console.log(`FOUND: ${user.email}`);
      console.log(`ROLE: ${user.role}`);
      console.log(`HAS PASSWORD: ${!!user.password}`);
    }
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();

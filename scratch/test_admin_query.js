const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing Admin Query...');
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' }
    });
    console.log(`Success! Found ${users.length} users.`);
    if (users.length > 0) {
      console.log('Sample User:', { id: users[0].id, email: users[0].email, role: users[0].role });
    }
  } catch (err) {
    console.error('Error detail:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();

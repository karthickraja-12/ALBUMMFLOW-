const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  const keepEmail = 'karthickraja8703@gmail.com';
  console.log(`Cleanup initialized. Keeping: ${keepEmail}`);

  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        email: {
          not: keepEmail
        }
      }
    });
    console.log(`Success! Deleted ${deleted.count} user(s).`);
  } catch (err) {
    console.error('Deletion failed Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();

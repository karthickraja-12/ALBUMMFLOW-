const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promote() {
  const email = 'karthickraja8703@gmail.com';
  console.log(`Promoting user: ${email}`);

  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: {
        role: 'super_admin',
        is_approved: true
      }
    });
    console.log('Success! User promoted to super_admin and approved.');
    console.log(user);
  } catch (err) {
    console.error('Error promoting user:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

promote();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log("--- ALL USERS IN DATABASE ---");
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Approved: ${u.is_approved}`);
    });
    console.log("----------------------------");
  } catch (error) {
    console.error("Error checking users:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

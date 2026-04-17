const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteAdmin() {
  const email = 'karthickraja8703@gmail.com';
  console.log(`🚀 Promoting ${email} to Super Admin...`);
  
  try {
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { 
        role: 'super_admin',
        is_approved: true 
      }
    });
    console.log(`✅ Success! ${updatedUser.email} is now a Super Admin and is Approved.`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User with email ${email} not found in the database.`);
    } else {
      console.error("❌ Error promoting user:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

promoteAdmin();

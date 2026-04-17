const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteGhostUser() {
  const email = 'karthickraja8703@gmail.com';
  console.log(`🚀 Searching for ghost record: ${email}...`);
  
  try {
    const deleted = await prisma.user.deleteMany({
      where: { email: email }
    });
    console.log(`✅ Success! Deleted ${deleted.count} records from the database.`);
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteGhostUser();

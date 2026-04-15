const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function reset() {
  const email = 'walterwhitejr831@gmail.com';
  const newPassword = 'karthick1252';
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'super_admin', // Just to be sure
        is_approved: true    // Just to be sure
      }
    });
    
    console.log('--- PASSWORD RESET SUCCESSFUL ---');
    console.log('User:', user.email);
    console.log('New Password: (updated to provided karthick1252)');
    console.log('Role:', user.role);
    console.log('Approved:', user.is_approved);
    console.log('---------------------------------');
  } catch (err) {
    console.error('Reset failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

reset();

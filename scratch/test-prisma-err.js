const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1];
}

const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log('Worked!', users.length);
  } catch (e) {
    console.log('ERROR IS:', e.message);
  }
}
test();

const { PrismaClient } = require('@prisma/client');

async function test(url, name) {
  try {
    const p = new PrismaClient({ datasources: { db: { url } } });
    await p.user.findMany();
    console.log(name + ' WORKED!');
    await p.$disconnect();
    return true;
  } catch(e) {
    console.log(name + ' FAILED: ' + e.message.split('\n')[0]);
    return false;
  }
}

async function run() {
  await test('postgresql://postgres:Karthick1252%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true', 'Test 1 (Just postgres)');
  await test('postgresql://postgres.kwqkgwlgvzjtohshnwyt:Karthick1252%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true', 'Test 2 (postgres.id)');
  await test('postgresql://postgres:Karthick1252%40@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true', 'Test 3 (ap-south-1)');
}
run();

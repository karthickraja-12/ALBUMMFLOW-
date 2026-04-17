const { Client } = require('pg');
const client = new Client({ connectionString: "postgresql://postgres.kwqkgwlgvzjtohshnwyt:Karthick1252%40@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" });

async function reset() {
  await client.connect();
  console.log('Connected!');
  const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public';");
  
  for (let row of res.rows) {
    if (row.tablename === 'schema_migrations' || row.tablename.includes('_prisma_migrations')) {
       await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
    } else {
       await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
    }
    console.log('Dropped table:', row.tablename);
  }

  console.log('Cleaned public schema.');
  await client.end();
}
reset().catch(console.error);

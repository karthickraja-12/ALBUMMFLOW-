const { Client } = require('pg');
const client = new Client({ connectionString: "postgresql://postgres.kwqkgwlgvzjtohshnwyt:Karthick1252%40@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" });

async function check() {
  await client.connect();
  const res = await client.query("SELECT * FROM \"User\" WHERE email = 'karthickraja8703@gmail.com';");
  console.log('User found:', res.rows.length > 0);
  if (res.rows.length > 0) {
    await client.query("UPDATE \"User\" SET role = 'super_admin', is_approved = true WHERE email = 'karthickraja8703@gmail.com';");
    console.log('User promoted successfully via raw SQL!');
  }
  await client.end();
}
check().catch(console.error);

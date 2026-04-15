const { Client } = require('pg');

const urls = [
  "postgresql://postgres:Karthick1252%40@db.tygcsspyvumvngummhum.supabase.co:5432/postgres",
  "postgresql://postgres:KarthickRDS12345@database-2.cluster-cwdami2kk3zg.us-east-1.rds.amazonaws.com:5432/postgres?schema=public&sslmode=no-verify&directConnection=true&connect_timeout=0"
];

async function check(url) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`Connected to: ${url.split('@')[1].split(':')[0]}`);
    const res = await client.query("SELECT id, name, email, role, is_approved FROM \"User\" WHERE email = 'walterwhite631@gmail.com'");
    if (res.rows.length === 0) {
      console.log('User not found.');
      const allUsers = await client.query("SELECT email, role FROM \"User\" LIMIT 5");
      console.log('Sample users in this DB:', allUsers.rows);
    } else {
      console.log('User details:', res.rows[0]);
    }
  } catch (err) {
    console.error(`Failed to connect to ${url.split('@')[1].split(':')[0]}:`, err.message);
  } finally {
    await client.end();
  }
}

async function run() {
  for (const url of urls) {
    await check(url);
    console.log('---');
  }
}

run();

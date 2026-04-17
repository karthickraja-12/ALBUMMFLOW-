const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function reset() {
  const client = new Client({ connectionString: 'postgresql://postgres:Karthick1252%40@db.kwqkgwlgvzjtohshnwyt.supabase.co:5432/postgres' });
  await client.connect();
  const newPassword = await bcrypt.hash('Karthick1252@', 10);
  await client.query("UPDATE \"User\" SET password = $1 WHERE email = 'karthickraja8703@gmail.com'", [newPassword]);
  console.log('Password reset successfully!');
  await client.end();
}
reset().catch(console.error);

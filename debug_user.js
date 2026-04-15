const { Client } = require('pg');
const url = 'postgresql://postgres:Karthick1252%40@db.tygcsspyvumvngummhum.supabase.co:5432/postgres';

async function check() {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT email, password FROM "User" WHERE email = $1', ['walterwhitejr831@gmail.com']);
    if (res.rows.length > 0) {
      const user = res.rows[0];
      console.log('User found in DB');
      console.log('Email:', user.email);
      console.log('Password set:', !!user.password);
      if (user.password) {
        console.log('Password starts with $2a$:', user.password.startsWith('$2a$'));
        console.log('Password length:', user.password.length);
      }
    } else {
      console.log('User not found in DB');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

check();

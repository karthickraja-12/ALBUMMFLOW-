const { Client } = require('pg');

const connectionString = "postgresql://postgres:Karthick1252%40@db.tygcsspyvumvngummhum.supabase.co:5432/postgres"; // Trying port 5432 instead of 6543

const client = new Client({
  connectionString: connectionString
});

client.connect()
  .then(() => {
    console.log('Connected to Supabase successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Time from Supabase:', res.rows[0].now);
  })
  .catch(err => {
    console.error('Connection error details:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
  })
  .finally(() => {
    client.end();
  });

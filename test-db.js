const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:KarthickRDS12345@database-2.cluster-cwdami2kk3zg.us-east-1.rds.amazonaws.com:5432/postgres?schema=public&sslmode=no-verify&directConnection=true&connect_timeout=0'
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Time from DB:', res.rows[0].now);
  })
  .catch(err => {
    console.error('Connection error details:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
  })
  .finally(() => {
    client.end();
  });

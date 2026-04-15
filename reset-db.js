const fs = require('fs');
const token = fs.readFileSync('aws-token.txt', 'utf8').trim();
const { Client } = require('pg');

const client = new Client({
  host: 'database-2.cluster-cwdami2kk3zg.us-east-1.rds.amazonaws.com',
  user: 'postgres',
  password: token,
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  try {
    await client.query("CREATE USER prisma_user WITH PASSWORD 'KarthickRDS12345';");
    await client.query("GRANT ALL PRIVILEGES ON DATABASE postgres TO prisma_user;");
    await client.query("ALTER DATABASE postgres OWNER TO prisma_user;");
    await client.query("GRANT rds_superuser TO prisma_user;");
    console.log('Created prisma_user successfully!');
  } catch (e) {
    console.error('SQL Error:', e.message);
  } finally {
    client.end();
  }
}).catch(e => console.error('Conn Error:', e.message));

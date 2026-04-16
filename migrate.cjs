const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:P8ri59E1HMCuLnyC@db.anyeaxiroihnhditggxi.supabase.co:5432/postgres',
});

client.connect();

const sql = fs.readFileSync('supabase/migrations/00_init.sql', 'utf8');
client.query(sql, (err, res) => {
  if (err) {
     console.error("Migration error:", err);
  } else {
     console.log('Migration ran successfully');
  }
  client.end();
});

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DEFAULT_DB_URL = 'postgresql://postgres:P8ri59E1HMCuLnyC@db.anyeaxiroihnhditggxi.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_POOL_URL || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || DEFAULT_DB_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

const runMigrations = async () => {
  const client = await pool.connect();

  const migrationDir = path.join(__dirname, 'supabase', 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  try {
    await client.query('BEGIN');

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      await client.query(sql);
      console.log(`Applied migration: ${file}`);
    }

    await client.query('COMMIT');
    console.log('All migrations ran successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration error:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations();

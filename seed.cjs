const seedData = require('./assets.json');

const { Pool } = require('pg');

const DEFAULT_DB_URL = 'postgresql://postgres:P8ri59E1HMCuLnyC@db.anyeaxiroihnhditggxi.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_POOL_URL || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || DEFAULT_DB_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Seeding categories...');
    const categoryMap = {};
    for (const cat of seedData.categories) {
      const res = await client.query(`
        INSERT INTO categories (name, slug) 
        VALUES ($1, $2)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [cat.name, cat.slug]);
      categoryMap[cat.slug] = res.rows[0].id;
    }

    console.log('Seeding products...');
    for (const prod of seedData.products) {
      await client.query(`
        INSERT INTO products (name, slug, description, price, discount_price, category_id, image_url, is_available)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET 
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url
      `, [
        prod.name, 
        prod.slug, 
        prod.description, 
        prod.price, 
        prod.discount_price || null, 
        categoryMap[prod.category_slug],
        prod.image_url,
        prod.is_available
      ]);
    }

    console.log('Seed complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => console.error(err));

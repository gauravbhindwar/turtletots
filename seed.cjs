const { createClient } = require('@supabase/supabase-js');
const seedData = require('./assets.json');

const supabaseUrl = 'https://anyeaxiroihnhditggxi.supabase.co';
const supabaseKey = 'sb_publishable_uXCMtH1Auj_vuIGn0CUHJw_3Oe-vzha'; // Using the publishable key since we disabled RLS temporarily or if we want, we should use postgres directly to bypass RLS, BUT user wants us to run migrations. Wait, the user provided the POSTGRES string. We should use `pg` to insert since we have RLS enabled and a service key is not provided!

const { Client } = require('pg');

async function seed() {
  const client = new Client({
    connectionString: 'postgresql://postgres:P8ri59E1HMCuLnyC@db.anyeaxiroihnhditggxi.supabase.co:5432/postgres'
  });
  
  await client.connect();

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
  await client.end();
}

seed().catch(err => console.error(err));

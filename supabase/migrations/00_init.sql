-- Enable UUID extension
create extension if not exists "uuid-ossp";

DROP TABLE IF EXISTS inquiries, product_images, product_variants, products, categories, admin_users CASCADE;

-- Admin Users mapping
create table admin_users (
  id uuid references auth.users(id) primary key,
  email text,
  created_at timestamp with time zone default now()
);

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default now()
);

-- Products
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10, 2) not null,
  discount_price numeric(10, 2),
  category_id uuid references categories(id) on delete set null,
  tags text[],
  image_url text,
  is_available boolean default true,
  views_count int default 0,
  created_at timestamp with time zone default now()
);

-- Product Variants
create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  color text,
  stock int default 0,
  sku text unique
);

-- Product Images
create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  image_url text not null,
  is_primary boolean default false,
  sort_order int default 0
);

-- Inquiries
create table inquiries (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete set null,
  message text not null,
  created_at timestamp with time zone default now()
);

-- Setup Row Level Security (RLS)
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table inquiries enable row level security;
alter table admin_users enable row level security;

-- Create general policies

-- Public Read Access
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read products" on products for select using (true);
create policy "Public can read product_variants" on product_variants for select using (true);
create policy "Public can read product_images" on product_images for select using (true);

-- Admin Full Access function check
create or replace function is_admin() returns boolean as $$
begin
  return exists (select 1 from admin_users where id = auth.uid());
end;
$$ language plpgsql security definer;

-- Admin Write Access policies
create policy "Admins can insert categories" on categories for insert with check (is_admin());
create policy "Admins can update categories" on categories for update using (is_admin());
create policy "Admins can delete categories" on categories for delete using (is_admin());

create policy "Admins can insert products" on products for insert with check (is_admin());
create policy "Admins can update products" on products for update using (is_admin());
create policy "Admins can delete products" on products for delete using (is_admin());

create policy "Admins can insert product_variants" on product_variants for insert with check (is_admin());
create policy "Admins can update product_variants" on product_variants for update using (is_admin());
create policy "Admins can delete product_variants" on product_variants for delete using (is_admin());

create policy "Admins can insert product_images" on product_images for insert with check (is_admin());
create policy "Admins can update product_images" on product_images for update using (is_admin());
create policy "Admins can delete product_images" on product_images for delete using (is_admin());

create policy "Public can insert inquiries" on inquiries for insert with check (true);
create policy "Admins can view inquiries" on inquiries for select using (is_admin());

-- Storage setup skipped as it's already configured on Supabase

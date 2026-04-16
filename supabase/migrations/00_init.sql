-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

DROP TABLE IF EXISTS inquiries, order_items, orders, product_images, product_variants, products, categories, profiles, admin_users CASCADE;

-- Admin Users mapping
create table admin_users (
  id uuid references auth.users(id) primary key,
  email text,
  created_at timestamp with time zone default now()
);

-- User profiles and role mapping
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  address text,
  role text not null default 'user' check (role in ('admin', 'manager', 'user')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index profiles_role_idx on profiles(role);

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  icon text not null default 'pets',
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

-- Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  shipping_address text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index orders_user_id_idx on orders(user_id);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  created_at timestamp with time zone default now()
);

create index order_items_order_id_idx on order_items(order_id);

-- Shared timestamp trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles for each row execute procedure set_updated_at();

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at before update on orders for each row execute procedure set_updated_at();

-- Create profile automatically when auth user is created
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role text;
begin
  resolved_role := coalesce(nullif(new.raw_app_meta_data->>'role', ''), 'user');

  if resolved_role not in ('admin', 'manager', 'user') then
    resolved_role := 'user';
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.phone, ''),
    resolved_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone;

  if resolved_role = 'admin' then
    insert into public.admin_users (id, email)
    values (new.id, coalesce(new.email, ''))
    on conflict (id) do update
    set email = excluded.email;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

-- Backfill profiles from existing auth users
insert into public.profiles (id, email, full_name, phone, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce(u.phone, ''),
  case
    when coalesce(nullif(u.raw_app_meta_data->>'role', ''), '') in ('admin', 'manager', 'user') then u.raw_app_meta_data->>'role'
    when a.id is not null then 'admin'
    else 'user'
  end
from auth.users u
left join public.admin_users a on a.id = u.id
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role;

-- Prevent non-admin users from changing role values
create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role <> old.role and not (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (select 1 from public.admin_users a where a.id = auth.uid())
  ) then
    raise exception 'Only admins can change user roles';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute procedure public.prevent_unauthorized_role_change();

-- Setup Row Level Security (RLS)
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table inquiries enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table admin_users enable row level security;

-- Create general policies

-- Public Read Access
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read products" on products for select using (true);
create policy "Public can read product_variants" on product_variants for select using (true);
create policy "Public can read product_images" on product_images for select using (true);

-- Role helper functions
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    (select 'admin' from public.admin_users a where a.id = auth.uid() limit 1),
    'user'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select public.current_role()) = 'admin';
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select public.current_role()) in ('manager', 'admin');
$$;

-- Profile policies
create policy "Users can read own profile"
on profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert own profile"
on profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Admins can manage all profiles"
on profiles for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Admin users mapping policies
create policy "Admins can manage admin_users"
on admin_users for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Catalog write access (manager + admin)
create policy "Managers and admins can insert categories" on categories for insert to authenticated with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can update categories" on categories for update to authenticated using ((select public.is_manager_or_admin())) with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can delete categories" on categories for delete to authenticated using ((select public.is_manager_or_admin()));

create policy "Managers and admins can insert products" on products for insert to authenticated with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can update products" on products for update to authenticated using ((select public.is_manager_or_admin())) with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can delete products" on products for delete to authenticated using ((select public.is_manager_or_admin()));

create policy "Managers and admins can insert product_variants" on product_variants for insert to authenticated with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can update product_variants" on product_variants for update to authenticated using ((select public.is_manager_or_admin())) with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can delete product_variants" on product_variants for delete to authenticated using ((select public.is_manager_or_admin()));

create policy "Managers and admins can insert product_images" on product_images for insert to authenticated with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can update product_images" on product_images for update to authenticated using ((select public.is_manager_or_admin())) with check ((select public.is_manager_or_admin()));
create policy "Managers and admins can delete product_images" on product_images for delete to authenticated using ((select public.is_manager_or_admin()));

create policy "Public can insert inquiries" on inquiries for insert with check (true);
create policy "Managers and admins can view inquiries" on inquiries for select to authenticated using ((select public.is_manager_or_admin()));

-- Orders policies
create policy "Users can create own orders"
on orders for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read own orders"
on orders for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Managers and admins can read all orders"
on orders for select to authenticated
using ((select public.is_manager_or_admin()));

create policy "Managers and admins can update orders"
on orders for update to authenticated
using ((select public.is_manager_or_admin()))
with check ((select public.is_manager_or_admin()));

create policy "Users can create own order items"
on order_items for insert to authenticated
with check (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

create policy "Users can read own order items"
on order_items for select to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

create policy "Managers and admins can read all order items"
on order_items for select to authenticated
using ((select public.is_manager_or_admin()));

create policy "Managers and admins can manage all order items"
on order_items for all to authenticated
using ((select public.is_manager_or_admin()))
with check ((select public.is_manager_or_admin()));

-- Storage setup for product image upload from admin UI
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can read product images" on storage.objects;
drop policy if exists "Public can upload product images" on storage.objects;
drop policy if exists "Public can update product images" on storage.objects;
drop policy if exists "Public can delete product images" on storage.objects;
drop policy if exists "Managers and admins can upload product images" on storage.objects;
drop policy if exists "Managers and admins can update product images" on storage.objects;
drop policy if exists "Managers and admins can delete product images" on storage.objects;

create policy "Public can read product images" on storage.objects
for select using (bucket_id = 'products');

create policy "Managers and admins can upload product images" on storage.objects
for insert to authenticated with check (bucket_id = 'products' and (select public.is_manager_or_admin()));

create policy "Managers and admins can update product images" on storage.objects
for update to authenticated using (bucket_id = 'products' and (select public.is_manager_or_admin())) with check (bucket_id = 'products' and (select public.is_manager_or_admin()));

create policy "Managers and admins can delete product images" on storage.objects
for delete to authenticated using (bucket_id = 'products' and (select public.is_manager_or_admin()));

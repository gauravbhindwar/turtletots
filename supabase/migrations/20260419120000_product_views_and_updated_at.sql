-- Add updated_at tracking to products table (was missing)
alter table public.products
  add column if not exists updated_at timestamp with time zone not null default now();

-- Back-fill existing rows so updated_at matches created_at
update public.products
  set updated_at = created_at
  where updated_at is null;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- Atomic view-count increment callable by any visitor (anon or authenticated).
-- security definer lets it bypass RLS (the UPDATE policy only allows managers/admins).
create or replace function public.increment_product_view(product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
  set views_count = coalesce(views_count, 0) + 1
  where id = product_id;
$$;

-- Grant to both anon (unauthenticated visitors) and authenticated users
grant execute on function public.increment_product_view(uuid) to anon, authenticated;

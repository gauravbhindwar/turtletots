-- Product highlight tags used by storefront collections.
alter table public.products
  add column if not exists tags text[];

update public.products
set tags = '{}'
where tags is null;

alter table public.products
  alter column tags set default '{}';

create index if not exists products_tags_gin_idx
  on public.products
  using gin (tags);

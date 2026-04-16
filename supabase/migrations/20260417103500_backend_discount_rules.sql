-- Enforce backend pricing rules for sale products.
-- `price` is treated as selling price.
-- `discount_price` is treated as original/MRP price and must be greater than selling price when present.

alter table public.products
  drop constraint if exists products_discount_price_gt_price_check;

update public.products
set discount_price = null
where discount_price is not null and discount_price <= price;

alter table public.products
  add constraint products_discount_price_gt_price_check
  check (discount_price is null or discount_price > price);

alter table public.products
  add column if not exists sale_discount_percent integer generated always as (
    case
      when discount_price is not null and discount_price > price and discount_price > 0
      then greatest(1, round(((discount_price - price) / discount_price) * 100)::integer)
      else null
    end
  ) stored;

create index if not exists products_sale_discount_percent_idx
  on public.products (sale_discount_percent)
  where sale_discount_percent is not null;

create index if not exists products_discount_price_idx
  on public.products (discount_price)
  where discount_price is not null;

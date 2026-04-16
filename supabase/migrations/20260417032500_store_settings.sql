create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  store_name text not null default 'TurtleTots',
  support_email text not null default 'support@turtletots.in',
  whatsapp_order_number text not null default '+91 9006045930',
  store_description text not null default 'Curated wooden toys and educational goods for your little ones.',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone not null default now()
);

insert into public.store_settings (
  id,
  store_name,
  support_email,
  whatsapp_order_number,
  store_description
)
values (
  true,
  'TurtleTots',
  'support@turtletots.in',
  '+91 9006045930',
  'Curated wooden toys and educational goods for your little ones.'
)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "Public can read store settings" on public.store_settings;
drop policy if exists "Managers and admins can insert store settings" on public.store_settings;
drop policy if exists "Managers and admins can update store settings" on public.store_settings;

create policy "Public can read store settings"
on public.store_settings
for select
using (true);

create policy "Managers and admins can insert store settings"
on public.store_settings
for insert
to authenticated
with check ((select public.is_manager_or_admin()));

create policy "Managers and admins can update store settings"
on public.store_settings
for update
to authenticated
using ((select public.is_manager_or_admin()))
with check ((select public.is_manager_or_admin()));

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute procedure public.set_updated_at();

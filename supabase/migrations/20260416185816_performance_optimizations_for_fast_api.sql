-- Performance indexes for high-traffic read paths
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_created_at_desc_idx on public.products (created_at desc);
create index if not exists products_is_available_created_at_desc_idx on public.products (is_available, created_at desc);
create index if not exists products_is_available_views_count_desc_idx on public.products (is_available, views_count desc);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);
create index if not exists product_variants_low_stock_idx on public.product_variants (stock) where stock <= 5;
create index if not exists profiles_created_at_desc_idx on public.profiles (created_at desc);
create index if not exists categories_created_at_desc_idx on public.categories (created_at desc);

-- Fast category list with product counts in one query
create or replace function public.list_categories_with_product_counts()
returns table (
	id uuid,
	name text,
	slug text,
	icon text,
	created_at timestamp with time zone,
	product_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
	select
		c.id,
		c.name,
		c.slug,
		c.icon,
		c.created_at,
		count(p.id)::bigint as product_count
	from public.categories c
	left join public.products p on p.category_id = c.id
	group by c.id
	order by c.created_at desc;
$$;

-- Admin dashboard snapshot built server-side to avoid large client-side scans
create or replace function public.get_admin_dashboard_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
	payload jsonb;
begin
	if not (select public.is_manager_or_admin()) then
		raise exception 'Not authorized to view admin analytics';
	end if;

	select jsonb_build_object(
		'totalProducts',
			(select count(*)::int from public.products),
		'totalCategories',
			(select count(*)::int from public.categories),
		'totalViews',
			coalesce((select sum(p.views_count)::bigint from public.products p), 0),
		'lowStockAlerts',
			(select count(*)::int from public.product_variants pv where pv.stock <= 5),
		'recentProducts',
			coalesce((
				select jsonb_agg(
					jsonb_build_object(
						'id', rp.id,
						'name', rp.name,
						'slug', rp.slug,
						'image_url', rp.image_url,
						'is_available', rp.is_available,
						'created_at', rp.created_at,
						'category_name', c.name
					)
					order by rp.created_at desc
				)
				from (
					select id, name, slug, image_url, is_available, created_at, category_id
					from public.products
					order by created_at desc
					limit 5
				) rp
				left join public.categories c on c.id = rp.category_id
			), '[]'::jsonb),
		'categoryDistribution',
			coalesce((
				select jsonb_agg(
					jsonb_build_object(
						'name', agg.name,
						'count', agg.product_count
					)
					order by agg.product_count desc
				)
				from (
					select
						coalesce(c.name, 'Others') as name,
						count(*)::int as product_count
					from public.products p
					left join public.categories c on c.id = p.category_id
					group by coalesce(c.name, 'Others')
					order by count(*) desc
					limit 4
				) agg
			), '[]'::jsonb)
	) into payload;

	return payload;
end;
$$;

grant execute on function public.list_categories_with_product_counts() to anon, authenticated;
grant execute on function public.get_admin_dashboard_snapshot() to authenticated;

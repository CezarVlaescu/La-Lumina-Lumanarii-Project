begin;

alter table public.catalog_products
  add column if not exists scent_id text;

alter table public.catalog_products
  add column if not exists primary_color_id text;

alter table public.catalog_products
  add column if not exists secondary_color_id text;

commit;

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_products (
  id text primary key,
  slug text not null unique,
  name text not null,
  subtitle text not null default '',
  description text not null default '',
  price_cents integer,
  image text not null default '',
  gallery_json jsonb not null default '[]'::jsonb,
  category text not null default 'Decorativă',
  collection text not null default '',
  burn_time text,
  weight text,
  details_json jsonb not null default '[]'::jsonb,
  themes_json jsonb not null default '[]'::jsonb,
  variants_json jsonb not null default '[]'::jsonb,
  tag text,
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_collections (
  slug text primary key,
  name text not null,
  parent_slug text,
  description text not null default '',
  position integer not null default 0,
  status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.product_inventory (
  sku text primary key,
  product_slug text not null,
  variant_id text not null default '',
  stock integer not null default 0 check (stock >= 0),
  updated_at timestamptz not null default now(),
  unique (product_slug, variant_id)
);

create table if not exists public.store_orders (
  id text primary key,
  order_number text not null unique,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'cash_on_delivery'
    check (payment_method in ('cash_on_delivery', 'stripe')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  checkout_attempt_id text unique,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_method text not null default 'sameday_address'
    check (shipping_method in ('sameday_address', 'sameday_easybox')),
  shipping_point_id text,
  shipping_point_name text,
  address_line text not null,
  city text not null,
  county text not null,
  postal_code text not null,
  country text not null default 'România',
  customer_note text,
  subtotal_cents integer not null,
  shipping_cents integer not null,
  total_cents integer not null,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_order_items (
  id text primary key,
  order_id text not null references public.store_orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  product_image text not null default '',
  variant_id text,
  variant_name text,
  unit_price_cents integer not null,
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null
);

create table if not exists public.store_order_status_history (
  id text primary key,
  order_id text not null references public.store_orders(id) on delete cascade,
  status text not null
    check (status in ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  note text,
  changed_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.store_email_deliveries (
  id text primary key,
  order_id text not null references public.store_orders(id) on delete cascade,
  event_key text not null unique,
  kind text not null
    check (kind in ('customer_order_confirmation', 'admin_new_order', 'customer_status_update')),
  order_status text,
  recipient text not null,
  subject text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'not_configured')),
  provider_id text,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.contact_messages (
  id text primary key,
  status text not null default 'new'
    check (status in ('new', 'read', 'closed')),
  first_name text not null,
  last_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.request_rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start bigint not null,
  updated_at timestamptz not null default now()
);

create index if not exists catalog_products_status_idx
  on public.catalog_products(status);
create index if not exists product_inventory_product_idx
  on public.product_inventory(product_slug);
create index if not exists store_orders_created_at_idx
  on public.store_orders(created_at desc);
create index if not exists store_orders_status_idx
  on public.store_orders(status);
create index if not exists store_orders_email_idx
  on public.store_orders(customer_email);
create index if not exists store_order_items_order_idx
  on public.store_order_items(order_id);
create index if not exists store_order_history_order_idx
  on public.store_order_status_history(order_id);
create index if not exists store_email_deliveries_order_idx
  on public.store_email_deliveries(order_id);
create index if not exists contact_messages_created_at_idx
  on public.contact_messages(created_at desc);
create index if not exists request_rate_limits_updated_at_idx
  on public.request_rate_limits(updated_at);

alter table public.admin_users enable row level security;
alter table public.catalog_products enable row level security;
alter table public.catalog_collections enable row level security;
alter table public.store_settings enable row level security;
alter table public.product_inventory enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;
alter table public.store_order_status_history enable row level security;
alter table public.store_email_deliveries enable row level security;
alter table public.contact_messages enable row level security;
alter table public.request_rate_limits enable row level security;

drop policy if exists "Publicul vede produsele publicate"
  on public.catalog_products;
create policy "Publicul vede produsele publicate"
  on public.catalog_products for select
  using (status = 'published');

drop policy if exists "Publicul vede colecțiile publicate"
  on public.catalog_collections;
create policy "Publicul vede colecțiile publicate"
  on public.catalog_collections for select
  using (status = 'published');

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Imaginile produselor sunt publice"
  on storage.objects;
create policy "Imaginile produselor sunt publice"
  on storage.objects for select
  using (bucket_id = 'product-media');

create or replace function public.store_create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_data jsonb := payload->'order';
  item_data jsonb;
  existing_order public.store_orders%rowtype;
  new_stock integer;
  affected integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(order_data->>'checkout_attempt_id', 0)
  );

  select * into existing_order
  from public.store_orders
  where checkout_attempt_id = order_data->>'checkout_attempt_id'
  limit 1;
  if found then
    return to_jsonb(existing_order);
  end if;

  for item_data in select value from jsonb_array_elements(payload->'items')
  loop
    insert into public.product_inventory (
      sku, product_slug, variant_id, stock, updated_at
    ) values (
      item_data->>'sku',
      item_data->>'product_slug',
      coalesce(item_data->>'variant_id', ''),
      (item_data->>'current_stock')::integer,
      (order_data->>'updated_at')::timestamptz
    )
    on conflict (sku) do nothing;

    update public.product_inventory
    set stock = stock - (item_data->>'quantity')::integer,
        updated_at = (order_data->>'updated_at')::timestamptz
    where sku = item_data->>'sku'
      and stock >= (item_data->>'quantity')::integer
    returning stock into new_stock;
    get diagnostics affected = row_count;
    if affected = 0 then
      raise exception 'INSUFFICIENT_STOCK';
    end if;

    if item_data->>'variant_index' is null then
      update public.catalog_products
      set stock = new_stock,
          updated_at = (order_data->>'updated_at')::timestamptz
      where slug = item_data->>'product_slug';
    else
      update public.catalog_products
      set variants_json = jsonb_set(
            variants_json,
            array[item_data->>'variant_index', 'stock'],
            to_jsonb(new_stock),
            false
          ),
          updated_at = (order_data->>'updated_at')::timestamptz
      where slug = item_data->>'product_slug';
    end if;
  end loop;

  insert into public.store_orders (
    id, order_number, status, payment_method, payment_status,
    checkout_attempt_id, customer_first_name, customer_last_name,
    customer_email, customer_phone, shipping_method, shipping_point_id,
    shipping_point_name, address_line, city, county, postal_code, country,
    customer_note, subtotal_cents, shipping_cents, total_cents, consent_at,
    created_at, updated_at
  ) values (
    order_data->>'id',
    order_data->>'order_number',
    'new',
    order_data->>'payment_method',
    'pending',
    order_data->>'checkout_attempt_id',
    order_data->>'customer_first_name',
    order_data->>'customer_last_name',
    order_data->>'customer_email',
    order_data->>'customer_phone',
    order_data->>'shipping_method',
    order_data->>'shipping_point_id',
    order_data->>'shipping_point_name',
    order_data->>'address_line',
    order_data->>'city',
    order_data->>'county',
    order_data->>'postal_code',
    coalesce(order_data->>'country', 'România'),
    order_data->>'customer_note',
    (order_data->>'subtotal_cents')::integer,
    (order_data->>'shipping_cents')::integer,
    (order_data->>'total_cents')::integer,
    (order_data->>'consent_at')::timestamptz,
    (order_data->>'created_at')::timestamptz,
    (order_data->>'updated_at')::timestamptz
  );

  for item_data in select value from jsonb_array_elements(payload->'items')
  loop
    insert into public.store_order_items (
      id, order_id, product_slug, product_name, product_image, variant_id,
      variant_name, unit_price_cents, quantity, line_total_cents
    ) values (
      item_data->>'id',
      order_data->>'id',
      item_data->>'product_slug',
      item_data->>'product_name',
      coalesce(item_data->>'product_image', ''),
      item_data->>'variant_id',
      item_data->>'variant_name',
      (item_data->>'unit_price_cents')::integer,
      (item_data->>'quantity')::integer,
      (item_data->>'line_total_cents')::integer
    );
  end loop;

  insert into public.store_order_status_history (
    id, order_id, status, note, changed_by, created_at
  ) values (
    payload->'history'->>'id',
    order_data->>'id',
    'new',
    payload->'history'->>'note',
    'checkout',
    (order_data->>'created_at')::timestamptz
  );

  select * into existing_order
  from public.store_orders
  where id = order_data->>'id';
  return to_jsonb(existing_order);
end;
$$;

create or replace function public.store_update_order_status(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.store_orders%rowtype;
  item_row public.store_order_items%rowtype;
  new_stock integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(payload->>'order_id', 0));
  select * into current_order
  from public.store_orders
  where id = payload->>'order_id'
  for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if coalesce((payload->>'restore_stock')::boolean, false)
     and current_order.status <> 'cancelled' then
    for item_row in
      select * from public.store_order_items
      where order_id = current_order.id
    loop
      insert into public.product_inventory (
        sku, product_slug, variant_id, stock, updated_at
      ) values (
        item_row.product_slug || '::' || coalesce(item_row.variant_id, 'default'),
        item_row.product_slug,
        coalesce(item_row.variant_id, ''),
        0,
        (payload->>'changed_at')::timestamptz
      )
      on conflict (sku) do nothing;

      update public.product_inventory
      set stock = stock + item_row.quantity,
          updated_at = (payload->>'changed_at')::timestamptz
      where sku = item_row.product_slug || '::' ||
        coalesce(item_row.variant_id, 'default')
      returning stock into new_stock;

      if item_row.variant_id is null then
        update public.catalog_products
        set stock = new_stock,
            updated_at = (payload->>'changed_at')::timestamptz
        where slug = item_row.product_slug;
      else
        update public.catalog_products
        set variants_json = (
              select jsonb_agg(
                case
                  when element->>'id' = item_row.variant_id
                    then jsonb_set(element, '{stock}', to_jsonb(new_stock), false)
                  else element
                end
                order by position
              )
              from jsonb_array_elements(variants_json)
                with ordinality as variants(element, position)
            ),
            updated_at = (payload->>'changed_at')::timestamptz
        where slug = item_row.product_slug;
      end if;
    end loop;
  end if;

  update public.store_orders
  set status = payload->>'status',
      payment_status = payload->>'payment_status',
      updated_at = (payload->>'changed_at')::timestamptz
  where id = current_order.id;

  insert into public.store_order_status_history (
    id, order_id, status, note, changed_by, created_at
  ) values (
    payload->>'history_id',
    current_order.id,
    payload->>'status',
    null,
    payload->>'changed_by',
    (payload->>'changed_at')::timestamptz
  );

  return (
    select to_jsonb(updated_order)
    from public.store_orders updated_order
    where updated_order.id = current_order.id
  );
end;
$$;

create or replace function public.store_consume_rate_limit(
  rate_key text,
  current_time bigint,
  reset_threshold bigint,
  updated_at_value timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.request_rate_limits%rowtype;
begin
  insert into public.request_rate_limits (
    key, count, window_start, updated_at
  ) values (
    rate_key, 1, current_time, updated_at_value
  )
  on conflict (key) do update set
    count = case
      when request_rate_limits.window_start <= reset_threshold then 1
      else request_rate_limits.count + 1
    end,
    window_start = case
      when request_rate_limits.window_start <= reset_threshold
        then current_time
      else request_rate_limits.window_start
    end,
    updated_at = updated_at_value
  returning * into result;
  return jsonb_build_object(
    'count', result.count,
    'window_start', result.window_start
  );
end;
$$;

revoke all on function public.store_create_order(jsonb) from public;
revoke all on function public.store_update_order_status(jsonb) from public;
revoke all on function public.store_consume_rate_limit(text, bigint, bigint, timestamptz) from public;
grant execute on function public.store_create_order(jsonb) to service_role;
grant execute on function public.store_update_order_status(jsonb) to service_role;
grant execute on function public.store_consume_rate_limit(text, bigint, bigint, timestamptz) to service_role;

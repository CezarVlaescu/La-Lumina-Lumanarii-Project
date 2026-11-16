begin;

alter table public.catalog_products
  add column if not exists scent_ids_json jsonb not null default '[]'::jsonb;

update public.catalog_products
set scent_ids_json = jsonb_build_array(scent_id)
where scent_id is not null
  and jsonb_array_length(coalesce(scent_ids_json, '[]'::jsonb)) = 0;

alter table public.store_order_items
  add column if not exists scent_id text;

alter table public.store_order_items
  add column if not exists scent_name text;

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
    if coalesce((item_data->>'track_inventory')::boolean, true) then
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
      variant_name, scent_id, scent_name, customization_json,
      unit_price_cents, quantity, line_total_cents
    ) values (
      item_data->>'id',
      order_data->>'id',
      item_data->>'product_slug',
      item_data->>'product_name',
      coalesce(item_data->>'product_image', ''),
      item_data->>'variant_id',
      item_data->>'variant_name',
      item_data->>'scent_id',
      item_data->>'scent_name',
      nullif(item_data->'customization', 'null'::jsonb),
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

revoke all on function public.store_create_order(jsonb) from public;
grant execute on function public.store_create_order(jsonb) to service_role;

commit;

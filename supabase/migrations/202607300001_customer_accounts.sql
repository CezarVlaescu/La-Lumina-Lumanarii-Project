create table if not exists public.customer_profiles (
  email text primary key,
  role text not null default 'member'
    check (role in ('member', 'administrator')),
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id text primary key,
  account_email text not null
    references public.customer_profiles(email) on delete cascade,
  label text not null default 'Acasă',
  address_line text not null,
  city text not null,
  county text not null,
  postal_code text not null default '',
  country text not null default 'România',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_profiles_role_idx
  on public.customer_profiles(role);
create index if not exists customer_profiles_updated_at_idx
  on public.customer_profiles(updated_at desc);
create index if not exists customer_addresses_account_idx
  on public.customer_addresses(account_email);
create index if not exists customer_addresses_default_idx
  on public.customer_addresses(account_email, is_default desc);

alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;

-- Nu se creează politici publice de scriere/citire. Magazinul accesează
-- profilurile și adresele exclusiv din rutele sale server-side, cu service_role.
-- Rolul implicit rămâne întotdeauna member; administratorii sunt autorizați
-- separat în admin_users și rolul este rezolvat din nou pe server.

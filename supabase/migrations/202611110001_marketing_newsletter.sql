create table if not exists public.newsletter_subscribers (
  email text primary key,
  first_name text not null default '',
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'footer',
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  provider_contact_id text,
  sync_status text not null default 'pending'
    check (sync_status in ('pending', 'synced', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers(status);
create index if not exists newsletter_subscribers_sync_status_idx
  on public.newsletter_subscribers(sync_status);
create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers(created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- Nu există politici publice: formularul și Admin folosesc numai codul server-side.

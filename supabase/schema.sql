-- MYNIX — database schema
-- Run once in Supabase → SQL Editor. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Admins: only users listed here can change products or upload photos.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins can see themselves" on public.admins;
create policy "admins can see themselves" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Lives in a private schema so it isn't callable through the public API.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- Admin rights need a two-step (aal2) session, not just the password.
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null check (category in ('torches', 'optical', 'scales', 'lapidary', 'accessories')),
  description text not null default '',
  features text[] not null default '{}',
  variants text[] not null default '{}',
  image text,
  flagship boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_order_idx on public.products (sort_order, name);

-- Only one flagship at a time.
create unique index if not exists products_single_flagship on public.products (flagship) where flagship;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;

drop policy if exists "anyone can read published products" on public.products;
create policy "anyone can read published products" on public.products
  for select to anon using (published);

drop policy if exists "signed-in users read published products, admins read all" on public.products;
create policy "signed-in users read published products, admins read all" on public.products
  for select to authenticated using (published or private.is_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- ---------------------------------------------------------------------------
-- Product photos (Storage bucket: public read, admin write)
-- ---------------------------------------------------------------------------
-- Size and type limits are enforced by Storage itself, not just the admin form.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage only deletes objects the caller can select, so admins need this for
-- remove() to work (public URLs are served without it).
drop policy if exists "admins read product images" on storage.objects;
create policy "admins read product images" on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and private.is_admin());

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and private.is_admin());

drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and private.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and private.is_admin());

-- ---------------------------------------------------------------------------
-- Newsletter subscribers. Visitors can't read or write the table directly;
-- sign-ups go through subscribe_newsletter(), which de-duplicates and
-- throttles in the database so limits hold across every server instance.
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email) and length(email) <= 254),
  visitor_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_visitor_idx on public.newsletter_subscribers (visitor_hash, created_at);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "admins read subscribers" on public.newsletter_subscribers;
create policy "admins read subscribers" on public.newsletter_subscribers
  for select to authenticated using (private.is_admin());

drop policy if exists "admins delete subscribers" on public.newsletter_subscribers;
create policy "admins delete subscribers" on public.newsletter_subscribers
  for delete to authenticated using (private.is_admin());

-- Returns 'subscribed', 'already-subscribed', 'invalid' or 'throttled'.
create or replace function public.subscribe_newsletter(p_email text, p_visitor_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
     or p_visitor_hash is null or length(p_visitor_hash) <> 64 then
    return 'invalid';
  end if;

  -- 5 new sign-ups per visitor per 10 minutes, 100 per hour site-wide.
  if (select count(*) from public.newsletter_subscribers
        where visitor_hash = p_visitor_hash and created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.newsletter_subscribers
        where created_at > now() - interval '1 hour') >= 100 then
    return 'throttled';
  end if;

  insert into public.newsletter_subscribers (email, visitor_hash)
  values (v_email, p_visitor_hash)
  on conflict (email) do nothing;

  return case when found then 'subscribed' else 'already-subscribed' end;
end;
$$;

revoke execute on function public.subscribe_newsletter(text, text) from public;
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;

-- Replaced by private.is_admin() (policies above no longer reference it).
drop function if exists public.is_admin();

-- Minimal stand-in for the parts of a Supabase project that supabase/schema.sql
-- and the app rely on: roles, auth.users, auth.uid() and the storage tables.
-- Test-only. Never run this against a real Supabase project.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login password 'authenticator' noinherit;
  end if;
end $$;

grant anon, authenticated, service_role to authenticator;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;

create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text
);
alter table storage.objects enable row level security;

grant usage on schema public, auth to anon, authenticated, service_role;
-- Supabase grants everything on public tables by default and relies on RLS.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- The rig's fake auth server creates users through this.
create or replace function public.rig_create_user(p_email text, p_is_anonymous boolean)
returns uuid language sql security definer as $$
  insert into auth.users (email, is_anonymous) values (p_email, p_is_anonymous) returning id
$$;
revoke all on function public.rig_create_user(text, boolean) from public, anon, authenticated;
grant execute on function public.rig_create_user(text, boolean) to service_role;

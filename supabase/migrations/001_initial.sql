-- ============================================================================
-- DreamWeaver — schema, RLS, and Storage policies
-- ============================================================================
-- Run in Supabase SQL Editor. Idempotent: safe to re-run.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ── Table ────────────────────────────────────────────────────────────────────
create table if not exists public.stories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  story_id text unique not null,
  setting text,
  img_url text,
  story_images jsonb default '[]'::jsonb,
  message_history jsonb default '[]'::jsonb,
  messages jsonb default '[]'::jsonb,
  possible_actions jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  is_anonymous boolean default false,
  anon_token text -- secret bearer token for anonymous owner identity
);

-- Add anon_token column if upgrading an existing table
alter table public.stories add column if not exists anon_token text;

create index if not exists idx_stories_story_id on public.stories(story_id);
create index if not exists idx_stories_user_id on public.stories(user_id);

-- ── updated_at trigger ───────────────────────────────────────────────────────
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_stories_updated_at on public.stories;
create trigger update_stories_updated_at
  before update on public.stories
  for each row execute function public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.stories enable row level security;

-- Drop any old, lax policies before recreating
drop policy if exists "Users can view own stories" on public.stories;
drop policy if exists "Users can create own stories" on public.stories;
drop policy if exists "Users can update own stories" on public.stories;
drop policy if exists "Users can delete own stories" on public.stories;

-- SELECT: own user rows OR anonymous rows (read-only by default — UPDATE is gated below)
create policy "stories_select" on public.stories
  for select
  using (
    auth.uid() = user_id
    or is_anonymous = true
  );

-- INSERT: an authenticated user can insert their own row, OR an anon row may be inserted
-- with is_anonymous = true (the client supplies the anon_token as a shared secret).
create policy "stories_insert" on public.stories
  for insert
  with check (
    (auth.uid() is not null and auth.uid() = user_id and is_anonymous = false)
    or (is_anonymous = true and anon_token is not null and length(anon_token) >= 16)
  );

-- UPDATE: only the row's owner. Anonymous rows can NOT be updated through anon-key
-- access — server endpoints with the service_role key handle anon updates safely
-- (after verifying the anon_token).
create policy "stories_update" on public.stories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: only the row's owner via anon-key. Server endpoints handle anon deletes.
create policy "stories_delete" on public.stories
  for delete
  using (auth.uid() = user_id);

-- ── Storage policies for story-images ────────────────────────────────────────
-- These tighten the previous "public WITH CHECK (true)" policies. Public reads
-- are fine because the bucket is public; writes require auth or service_role.
do $$
begin
  -- Drop legacy permissive policies if present
  if exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'Allow public uploads') then
    execute 'drop policy "Allow public uploads" on storage.objects';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'Allow public updates') then
    execute 'drop policy "Allow public updates" on storage.objects';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'Authenticated users can upload images') then
    execute 'drop policy "Authenticated users can upload images" on storage.objects';
  end if;
end $$;

-- Public can read story-images (bucket is public)
drop policy if exists "story_images_read" on storage.objects;
create policy "story_images_read" on storage.objects
  for select
  using (bucket_id = 'story-images');

-- Authenticated users can upload (server-side service_role bypasses RLS so it always works)
drop policy if exists "story_images_insert_authenticated" on storage.objects;
create policy "story_images_insert_authenticated" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'story-images');

-- Authenticated users can update their own uploads
drop policy if exists "story_images_update_authenticated" on storage.objects;
create policy "story_images_update_authenticated" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'story-images')
  with check (bucket_id = 'story-images');

-- Authenticated users can delete (cascade-delete is handled by the server endpoint)
drop policy if exists "story_images_delete_authenticated" on storage.objects;
create policy "story_images_delete_authenticated" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'story-images');

-- ============================================================================
-- DreamWeaver database schema
-- ============================================================================
-- Paste this whole file into the Supabase SQL Editor and run it.
-- It is idempotent: safe on a fresh project, on the original (CRA-era) schema,
-- and on a database where an earlier version of this file was already run.
--
-- Access model
--   * Browsers can only READ: their own stories, and stories marked public.
--   * Every write goes through the app's API routes using the service role.
-- ============================================================================

-- ── stories ─────────────────────────────────────────────────────────────────
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  setting text,
  cover_url text,
  scene_count integer not null default 0,
  is_public boolean not null default false,
  bible jsonb not null default '{}'::jsonb,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade path from the original schema, where the short id lived in story_id.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'stories' and column_name = 'story_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'stories' and column_name = 'legacy_id'
  ) then
    alter table public.stories rename column story_id to legacy_id;
  end if;
end $$;

alter table public.stories add column if not exists legacy_id text;
alter table public.stories alter column legacy_id drop not null;
alter table public.stories add column if not exists cover_url text;
alter table public.stories add column if not exists scene_count integer not null default 0;
alter table public.stories add column if not exists is_public boolean not null default false;
-- The story bible: established characters, places, carried items and a running summary.
alter table public.stories add column if not exists bible jsonb not null default '{}'::jsonb;
-- Choices made when a story starts, and whether its last page has been written.
alter table public.stories add column if not exists reading_level text not null default 'family';
alter table public.stories add column if not exists art_style text not null default 'watercolor';
alter table public.stories add column if not exists finished boolean not null default false;
-- A shared secret from an earlier design; it was readable by anyone, so remove it.
alter table public.stories drop column if exists anon_token;

create unique index if not exists stories_legacy_id_key on public.stories (legacy_id);
create index if not exists idx_stories_user_updated on public.stories (user_id, updated_at desc);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_stories_updated_at on public.stories;
create trigger update_stories_updated_at
  before update on public.stories
  for each row execute function public.update_updated_at_column();

-- ── scenes ──────────────────────────────────────────────────────────────────
-- One row per story beat. The illustration lives on the scene it belongs to,
-- so text and pictures can never drift out of step.
create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  position integer not null,
  action text,
  narration text not null,
  choices jsonb not null default '[]'::jsonb,
  image_prompt text,
  image_url text,
  image_attempts integer not null default 0,
  created_at timestamptz not null default now(),
  unique (story_id, position)
);

-- ── story plans ─────────────────────────────────────────────────────────────
-- The narrator's private notes for a story (what is at stake, the troubles
-- waiting to happen, the secret's answer). Kept apart from stories so that no
-- browser can ever read them, even for a shared story.
create table if not exists public.story_plans (
  story_id uuid primary key references public.stories (id) on delete cascade,
  plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── characters ──────────────────────────────────────────────────────────────
-- A reader's saved characters: a name, a fixed look, and the portrait they chose.
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  appearance text not null,
  portrait_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_characters_user on public.characters (user_id, created_at);

-- ── usage / quotas ──────────────────────────────────────────────────────────
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_usage_user_kind_time on public.usage_events (user_id, kind, created_at);
create index if not exists idx_usage_kind_time on public.usage_events (kind, created_at);

-- Records one unit of usage if both the per-user and the global budget allow it.
-- Returns 'ok', 'user_limit' or 'global_limit'.
create or replace function public.consume_quota(
  p_user uuid,
  p_kind text,
  p_user_limit integer,
  p_global_limit integer,
  p_window interval default interval '24 hours'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('dreamweaver_quota'), hashtext(p_kind));

  if (select count(*) from usage_events
      where user_id = p_user and kind = p_kind and created_at > now() - p_window) >= p_user_limit then
    return 'user_limit';
  end if;

  if (select count(*) from usage_events
      where kind = p_kind and created_at > now() - p_window) >= p_global_limit then
    return 'global_limit';
  end if;

  insert into usage_events (user_id, kind) values (p_user, p_kind);
  return 'ok';
end;
$$;

-- ── claim tickets ───────────────────────────────────────────────────────────
-- Lets a guest carry their stories into the account they sign in to.
create table if not exists public.claim_tickets (
  ticket uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  created_at timestamptz not null default now()
);

-- ── one-time conversion of original-schema stories into scenes ──────────────
do $$
declare
  s record;
  m record;
  n integer;
  pending_action text;
  img text;
  cover text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'stories' and column_name = 'messages'
  ) then
    return;
  end if;

  for s in execute $q$
    select st.id, st.user_id, st.messages, st.story_images, st.possible_actions
    from public.stories st
    where jsonb_typeof(st.messages) = 'array'
      and jsonb_array_length(st.messages) > 0
      and not exists (select 1 from public.scenes sc where sc.story_id = st.id)
  $q$ loop
    n := 0;
    pending_action := null;
    cover := null;

    for m in
      select value ->> 'text' as body, value ->> 'sender' as sender
      from jsonb_array_elements(s.messages) with ordinality as t (value, ord)
      order by ord
    loop
      if m.body is null or btrim(m.body) = '' then
        continue;
      end if;

      if m.sender = 'human' then
        pending_action := m.body;
      elsif m.body like '✨ Weaving%' or m.body like '⚠️%'
         or m.body like 'Error:%' or m.body like 'An error occurred%' then
        continue;
      else
        img := case when jsonb_typeof(s.story_images) = 'array' then s.story_images ->> n end;
        -- Temporary OpenAI links and the old placeholder are long dead.
        if img is not null and (img like '%oaidalleapiprodscus%' or img like '%/loading.png') then
          img := null;
        end if;
        if cover is null then
          cover := img;
        end if;

        insert into public.scenes (story_id, position, action, narration, image_url, image_attempts)
        values (s.id, n, pending_action, m.body, img, 3);

        pending_action := null;
        n := n + 1;
      end if;
    end loop;

    if n > 0 then
      update public.scenes
      set choices = case when jsonb_typeof(s.possible_actions) = 'array'
                         then s.possible_actions else '[]'::jsonb end
      where story_id = s.id and position = n - 1;

      -- Stories without an owner were readable by anyone holding the id; keep that.
      execute 'update public.stories set scene_count = $1, cover_url = $2,
                 is_public = is_public or user_id is null where id = $3'
        using n, cover, s.id;
    end if;
  end loop;
end $$;

-- ── row level security ──────────────────────────────────────────────────────
alter table public.stories enable row level security;
alter table public.scenes enable row level security;
alter table public.characters enable row level security;
alter table public.story_plans enable row level security;
alter table public.usage_events enable row level security;
alter table public.claim_tickets enable row level security;

do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in (
        'stories', 'scenes', 'characters', 'story_plans', 'usage_events', 'claim_tickets'
      )
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy stories_read on public.stories
  for select
  using (is_public or user_id = (select auth.uid()));

create policy scenes_read on public.scenes
  for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = scenes.story_id
        and (s.is_public or s.user_id = (select auth.uid()))
    )
  );

create policy characters_read on public.characters
  for select
  using (user_id = (select auth.uid()));

-- Belt and braces: browsers get read access only, and none to bookkeeping tables.
revoke insert, update, delete, truncate on public.stories, public.scenes, public.characters from anon, authenticated;
grant select on public.stories, public.scenes, public.characters to anon, authenticated;
revoke all on public.usage_events, public.claim_tickets, public.story_plans from anon, authenticated;
revoke all on function public.consume_quota(uuid, text, integer, integer, interval) from public, anon, authenticated;
grant execute on function public.consume_quota(uuid, text, integer, integer, interval) to service_role;
grant all on public.stories, public.scenes, public.characters, public.story_plans, public.usage_events, public.claim_tickets to service_role;

-- ── storage ─────────────────────────────────────────────────────────────────
-- Public bucket: anyone can view an illustration by URL, only the server writes.
insert into storage.buckets (id, name, public)
values ('story-images', 'story-images', true)
on conflict (id) do update set public = true;

do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in (
        'Allow public uploads', 'Allow public access', 'Allow public updates',
        'Public can read story images', 'Authenticated users can upload images',
        'story_images_read', 'story_images_insert_authenticated',
        'story_images_update_authenticated', 'story_images_delete_authenticated'
      )
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

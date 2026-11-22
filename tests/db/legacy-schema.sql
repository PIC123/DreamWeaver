-- The original (CRA-era) schema plus sample rows, used to test the upgrade path.

create extension if not exists "uuid-ossp";

create table public.stories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users (id) on delete cascade,
  story_id text unique not null,
  setting text,
  img_url text,
  story_images jsonb default '[]'::jsonb,
  message_history jsonb default '[]'::jsonb,
  messages jsonb default '[]'::jsonb,
  possible_actions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_anonymous boolean default false
);
alter table public.stories enable row level security;
create policy "Users can view own stories" on public.stories for select
  using (auth.uid() = user_id or is_anonymous = true);
create policy "Users can create own stories" on public.stories for insert
  with check (auth.uid() = user_id or is_anonymous = true);
create policy "Users can update own stories" on public.stories for update
  using (auth.uid() = user_id or is_anonymous = true)
  with check (auth.uid() = user_id or is_anonymous = true);
create policy "Users can delete own stories" on public.stories for delete
  using (auth.uid() = user_id);
create policy "Allow public uploads" on storage.objects for insert to public
  with check (bucket_id = 'story-images');

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'owner@example.com');

-- An anonymous story: two finished scenes, one stuck loading bubble, one dead OpenAI link.
insert into public.stories (story_id, user_id, setting, is_anonymous, messages, story_images, possible_actions)
values (
  'abc123xyz', null, 'A haunted lighthouse', true,
  '[{"text":"You stand at the door.","sender":"system"},
    {"text":"Open the door","sender":"human"},
    {"text":"✨ Weaving your tale...","sender":"system"},
    {"text":"Open the door","sender":"human"},
    {"text":"The door creaks open.","sender":"system"}]'::jsonb,
  '["https://proj.supabase.co/storage/v1/object/public/story-images/abc123xyz/0.png",
    "https://oaidalleapiprodscus.blob.core.windows.net/private/expired.png"]'::jsonb,
  '["Climb the stairs","Light the lamp"]'::jsonb
);

-- An owned story with one scene, and an empty one that must be left alone.
insert into public.stories (story_id, user_id, setting, messages, story_images, possible_actions)
values
  ('owned0001', '00000000-0000-0000-0000-00000000000a', 'A cloud city',
   '[{"text":"Clouds drift by.","sender":"system"}]'::jsonb,
   '["https://proj.supabase.co/storage/v1/object/public/story-images/owned0001/0.png"]'::jsonb,
   '["Jump","Wait"]'::jsonb),
  ('empty0001', '00000000-0000-0000-0000-00000000000a', 'Nothing yet', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb);

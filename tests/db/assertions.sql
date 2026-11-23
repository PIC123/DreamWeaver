-- Checks the access rules in supabase/schema.sql. Run by tests/db/run.sh.
-- Each check raises an exception on failure, so psql exits non-zero.

\set ON_ERROR_STOP on

insert into auth.users (id, email, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000a1', 'alice@example.com', false),
  ('00000000-0000-0000-0000-0000000000b2', null, true)
on conflict do nothing;

insert into public.stories (id, user_id, setting, is_public) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Alice private', false),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Alice public', true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b2', 'Guest private', false);
insert into public.characters (user_id, name, appearance) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alice hero', 'red coat'),
  ('00000000-0000-0000-0000-0000000000b2', 'Guest hero', 'blue hat');
insert into public.story_plans (story_id, plan) values
  ('10000000-0000-0000-0000-000000000002', '{"secretAnswer":"hidden"}');
insert into public.scenes (story_id, position, narration) values
  ('10000000-0000-0000-0000-000000000001', 0, 'private scene'),
  ('10000000-0000-0000-0000-000000000002', 0, 'public scene'),
  ('10000000-0000-0000-0000-000000000003', 0, 'guest scene');

create or replace function pg_temp.expect(label text, actual bigint, wanted bigint) returns void
language plpgsql as $$
begin
  if actual is distinct from wanted then
    raise exception 'FAIL %: got %, wanted %', label, actual, wanted;
  end if;
  raise notice 'ok   %', label;
end $$;

create or replace function pg_temp.expect_denied(label text, stmt text) returns void
language plpgsql as $$
declare
  affected bigint;
begin
  begin
    execute stmt;
    get diagnostics affected = row_count;
  exception when insufficient_privilege then
    raise notice 'ok   % (permission denied)', label;
    return;
  end;
  if affected > 0 then
    raise exception 'FAIL %: statement changed % row(s)', label, affected;
  end if;
  raise notice 'ok   % (no rows affected)', label;
end $$;

-- Visitor with no session: public content only.
set role anon;
select set_config('request.jwt.claims', '{}', false);
select pg_temp.expect('anon sees only public stories', (select count(*) from public.stories where id::text like '10000000-%'), 1);
select pg_temp.expect('anon sees only public scenes', (select count(*) from public.scenes where narration in ('private scene','public scene','guest scene')), 1);
select pg_temp.expect('anon sees no characters', (select count(*) from public.characters), 0);
select pg_temp.expect_denied('anon cannot read the plan of a shared story', $$select 1 from public.story_plans$$);
select pg_temp.expect_denied('anon cannot insert a story', $$insert into public.stories (setting) values ('x')$$);
select pg_temp.expect_denied('anon cannot update a public story', $$update public.stories set setting = 'hacked' where is_public$$);
select pg_temp.expect_denied('anon cannot read usage', $$select 1 from public.usage_events$$);
select pg_temp.expect_denied('anon cannot call consume_quota', $$select public.consume_quota('00000000-0000-0000-0000-0000000000b2', 'turn', 5, 5)$$);
reset role;

-- Guest (anonymous sign-in): own stories plus public ones, still read-only.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2"}', false);
select pg_temp.expect('guest sees own + public stories', (select count(*) from public.stories where id::text like '10000000-%'), 2);
select pg_temp.expect('guest sees own + public scenes', (select count(*) from public.scenes where narration in ('private scene','public scene','guest scene')), 2);
select pg_temp.expect('guest sees only their own character', (select count(*) from public.characters where name = 'Guest hero'), 1);
select pg_temp.expect('guest cannot see another reader''s character', (select count(*) from public.characters where name = 'Alice hero'), 0);
select pg_temp.expect_denied('guest cannot create a character directly', $$insert into public.characters (user_id, name, appearance) values ('00000000-0000-0000-0000-0000000000b2', 'x', 'y')$$);
select pg_temp.expect_denied('guest cannot edit a character directly', $$update public.characters set appearance = 'changed'$$);
select pg_temp.expect_denied('guest cannot update own story directly', $$update public.stories set is_public = true where setting = 'Guest private'$$);
select pg_temp.expect_denied('guest cannot delete own story directly', $$delete from public.stories where setting = 'Guest private'$$);
select pg_temp.expect_denied('guest cannot insert scenes', $$insert into public.scenes (story_id, position, narration) values ('10000000-0000-0000-0000-000000000003', 1, 'x')$$);
select pg_temp.expect_denied('guest cannot read story plans', $$select 1 from public.story_plans$$);
select pg_temp.expect_denied('guest cannot read claim tickets', $$select 1 from public.claim_tickets$$);
reset role;

-- Signed-in owner.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
select pg_temp.expect('owner sees both own stories', (select count(*) from public.stories where id::text like '10000000-%'), 2);
reset role;

-- Server (service role): quotas.
set role service_role;
select pg_temp.expect('quota allows first', (select count(*) from (select public.consume_quota('00000000-0000-0000-0000-0000000000b2', 'turn', 2, 3)) q(r) where r = 'ok'), 1);
select pg_temp.expect('quota allows second', (select count(*) from (select public.consume_quota('00000000-0000-0000-0000-0000000000b2', 'turn', 2, 3)) q(r) where r = 'ok'), 1);
select pg_temp.expect('quota blocks third for user', (select count(*) from (select public.consume_quota('00000000-0000-0000-0000-0000000000b2', 'turn', 2, 3)) q(r) where r = 'user_limit'), 1);
select pg_temp.expect('quota allows other user', (select count(*) from (select public.consume_quota('00000000-0000-0000-0000-0000000000a1', 'turn', 2, 3)) q(r) where r = 'ok'), 1);
select pg_temp.expect('quota blocks at global cap', (select count(*) from (select public.consume_quota('00000000-0000-0000-0000-0000000000a1', 'turn', 2, 3)) q(r) where r = 'global_limit'), 1);
select pg_temp.expect('other kinds are counted separately', (select count(*) from (select public.consume_quota('00000000-0000-0000-0000-0000000000a1', 'setting', 2, 3)) q(r) where r = 'ok'), 1);
reset role;

select pg_temp.expect('duplicate scene position is rejected', (
  select count(*) from (select 1) x where not exists (select 1 from pg_constraint where conrelid = 'public.scenes'::regclass and contype = 'u')
), 0);
select pg_temp.expect('no write policies exist', (select count(*) from pg_policies where schemaname = 'public' and cmd <> 'SELECT'), 0);
select pg_temp.expect('old storage policies are gone', (select count(*) from pg_policies where schemaname = 'storage'), 0);
select pg_temp.expect('bucket is public', (select count(*) from storage.buckets where id = 'story-images' and public), 1);
select pg_temp.expect('stories start with an empty bible', (select count(*) from public.stories where id::text like '10000000-%' and bible = '{}'::jsonb), 3);
select pg_temp.expect('stories default to family level, watercolour, unfinished', (select count(*) from public.stories where id::text like '10000000-%' and reading_level = 'family' and art_style = 'watercolor' and not finished), 3);

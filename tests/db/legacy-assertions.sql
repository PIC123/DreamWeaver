-- Checks that original-schema stories were converted into scenes correctly.
\set ON_ERROR_STOP on

create or replace function pg_temp.expect(label text, actual text, wanted text) returns void
language plpgsql as $$
begin
  if actual is distinct from wanted then
    raise exception 'FAIL %: got %, wanted %', label, actual, wanted;
  end if;
  raise notice 'ok   %', label;
end $$;

select pg_temp.expect('short id kept as legacy_id', (select count(*)::text from public.stories where legacy_id = 'abc123xyz'), '1');
select pg_temp.expect('guest story has two scenes', (select scene_count::text from public.stories where legacy_id = 'abc123xyz'), '2');
select pg_temp.expect('loading bubble and duplicate dropped', (select count(*)::text from public.scenes sc join public.stories st on st.id = sc.story_id where st.legacy_id = 'abc123xyz'), '2');
select pg_temp.expect('action attached to its scene', (select sc.action from public.scenes sc join public.stories st on st.id = sc.story_id where st.legacy_id = 'abc123xyz' and sc.position = 1), 'Open the door');
select pg_temp.expect('first scene has no action', (select coalesce(sc.action, '<null>') from public.scenes sc join public.stories st on st.id = sc.story_id where st.legacy_id = 'abc123xyz' and sc.position = 0), '<null>');
select pg_temp.expect('stored image kept', (select (sc.image_url like '%/abc123xyz/0.png')::text from public.scenes sc join public.stories st on st.id = sc.story_id where st.legacy_id = 'abc123xyz' and sc.position = 0), 'true');
select pg_temp.expect('expired OpenAI link dropped', (select coalesce(sc.image_url, '<null>') from public.scenes sc join public.stories st on st.id = sc.story_id where st.legacy_id = 'abc123xyz' and sc.position = 1), '<null>');
select pg_temp.expect('choices on last scene', (select sc.choices ->> 0 from public.scenes sc join public.stories st on st.id = sc.story_id where st.legacy_id = 'abc123xyz' and sc.position = 1), 'Climb the stairs');
select pg_temp.expect('ownerless story stays readable', (select is_public::text from public.stories where legacy_id = 'abc123xyz'), 'true');
select pg_temp.expect('owned story stays private', (select is_public::text from public.stories where legacy_id = 'owned0001'), 'false');
select pg_temp.expect('cover set from first image', (select (cover_url like '%/owned0001/0.png')::text from public.stories where legacy_id = 'owned0001'), 'true');
select pg_temp.expect('empty story untouched', (select scene_count::text from public.stories where legacy_id = 'empty0001'), '0');
select pg_temp.expect('re-running does not duplicate scenes', (select count(*)::text from public.scenes), '3');
select pg_temp.expect('old policies replaced', (select count(*)::text from pg_policies where schemaname = 'public' and policyname like 'Users can%'), '0');

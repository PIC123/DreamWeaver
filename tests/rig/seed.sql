-- A public story from the original app, reachable by its old short id.
insert into public.stories (id, legacy_id, setting, is_public, scene_count)
values ('20000000-0000-0000-0000-000000000001', 'abc123xyz', 'A haunted lighthouse', true, 1);
insert into public.scenes (story_id, position, narration, image_attempts)
values ('20000000-0000-0000-0000-000000000001', 0, 'You stand at the lighthouse door.', 3);

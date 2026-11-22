import { requireUser } from '@/lib/server/auth';
import { assertAllowed, streamTurn } from '@/lib/server/ai';
import { HttpError, readJson, route } from '@/lib/server/http';
import { spendQuota } from '@/lib/server/quota';
import { loadOwnedStory, loadScenes } from '@/lib/server/stories';
import { SCENE_COLUMNS, toScene, type SceneRow } from '@/lib/story/rows';
import { getAdmin } from '@/lib/supabase/server';
import { mergeBible, normalizeBible } from '@/lib/story/bible';
import { buildMessages, buildSceneBrief } from '@/lib/story/prompt';
import { LIMITS, type TurnEvent } from '@/lib/story/types';

export const maxDuration = 60;

type Ctx = { params: Promise<{ storyId: string }> };

/**
 * Writes the next scene. With no scenes yet this is the opening and `action` is
 * ignored. Responds with newline-delimited JSON: narration deltas, then the saved scene
 * together with the updated story bible.
 */
export const POST = route(async (req: Request, ctx: Ctx) => {
  const { storyId } = await ctx.params;
  const user = await requireUser(req);
  const story = await loadOwnedStory(storyId, user);
  const scenes = await loadScenes(story.id);

  const body = await readJson<{ action?: unknown; expectedPosition?: unknown }>(req);
  const position = scenes.length;

  // The client says which scene it thinks comes next, so a double submit or a
  // second tab cannot silently write the same turn twice.
  if (typeof body.expectedPosition === 'number' && body.expectedPosition !== position) {
    throw new HttpError(409, 'This story has moved on. Reload to catch up.');
  }
  if (position >= LIMITS.maxScenesPerStory) {
    throw new HttpError(
      409,
      'This story has reached its final page. Start a new one to keep adventuring.',
    );
  }

  let action: string | null = null;
  if (position > 0) {
    action = typeof body.action === 'string' ? body.action.replace(/\s+/g, ' ').trim() : '';
    if (!action) throw new HttpError(400, 'Say what you want to do next.');
    if (action.length > LIMITS.actionMaxLength) {
      throw new HttpError(400, `Keep your action under ${LIMITS.actionMaxLength} characters.`);
    }
    await assertAllowed(action);
  }

  await spendQuota(user, 'turn');

  const bible = normalizeBible(story.bible);
  const messages = buildMessages(story.setting ?? '', scenes, action, bible);
  const encoder = new TextEncoder();

  // If the reader closes the tab mid-turn we still finish and save the scene:
  // it has been paid for, and it will be there when they come back.
  let readerGone = false;
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      readerGone = true;
    },
    async start(controller) {
      const send = (event: TurnEvent) => {
        if (readerGone) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          readerGone = true;
        }
      };
      try {
        const turn = await streamTurn(messages, (text) => send({ type: 'delta', text }));

        const nextBible = mergeBible(bible, turn.update);

        const admin = getAdmin();
        const { data, error } = await admin
          .from('scenes')
          .insert({
            story_id: story.id,
            position,
            action,
            narration: turn.narration,
            choices: turn.choices,
            image_prompt: buildSceneBrief(nextBible, turn),
          })
          .select(SCENE_COLUMNS)
          .single();

        if (error) {
          if (error.code === '23505') {
            send({ type: 'error', message: 'This story has moved on. Reload to catch up.' });
          } else {
            throw new Error(`save scene failed: ${error.message}`);
          }
        } else {
          const { error: storyError } = await admin
            .from('stories')
            .update({ scene_count: position + 1, bible: nextBible })
            .eq('id', story.id);
          if (storyError) console.error('update story after turn failed:', storyError.message);
          send({ type: 'scene', scene: toScene(data as SceneRow), bible: nextBible });
        }
      } catch (err) {
        console.error('turn failed:', err);
        const status = (err as { status?: number }).status;
        send({
          type: 'error',
          message:
            status === 429
              ? 'The storyteller is out of breath (the AI service is rate limited). Try again in a moment.'
              : 'The storyteller lost the thread. Please try that again.',
        });
      } finally {
        if (!readerGone) {
          try {
            controller.close();
          } catch {
            /* already closed by the runtime */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
});

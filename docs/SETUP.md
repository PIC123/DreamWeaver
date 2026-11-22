# Setting up DreamWeaver

You need a Supabase project, an OpenAI API key, and (to deploy) a Vercel project.

## 1. Supabase

1. **Create a project** at [supabase.com](https://supabase.com), or open your existing one.
2. **Run the schema.** SQL Editor → New query → paste all of
   [`supabase/schema.sql`](../supabase/schema.sql) → Run.
   It is safe to re-run, and safe on a database that already has stories from the
   original version of the app: those are converted in place (see the end of this page).
3. **Allow guests.** Authentication → Sign In / Providers → turn on
   **Allow anonymous sign-ins**. Without this, visitors must sign in before they can write.
4. **Set your URLs.** Authentication → URL Configuration: set *Site URL* to your deployed
   address and add it (plus `http://localhost:3000`) under *Redirect URLs*, with `/**` on
   the end. Email confirmation and password-reset links use these.
5. **Copy your keys** from Project Settings → API: the project URL, the anon (publishable)
   key, and the service-role (secret) key.

Recommended once you have real visitors: under Authentication → Attack Protection, enable
CAPTCHA for sign-ins. Guest sessions are cheap to create, and the per-guest budget below
only helps if creating thousands of them is hard.

## 2. Environment variables

| Name | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | `REACT_APP_SUPABASE_URL` is also accepted |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | `REACT_APP_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are also accepted |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | `SUPABASE_SECRET_KEY` is also accepted |
| `OPENAI_API_KEY` | **server only** | |

Locally, put them in `.env.local` (copy `.env.example`). On Vercel, add them under
Settings → Environment Variables for Production and Preview, then redeploy: the two
public values are baked in at build time.

Optional settings, with their defaults, are listed in [`.env.example`](../.env.example):
which models to use, image quality and size, and the daily budgets.

## 3. Deploy to Vercel

Import the repository; Vercel detects Next.js. The `vercel.json` in this repo only exists
to cancel build settings left over from the original Create React App project.

API routes are limited to 60 seconds, which every Vercel plan allows. If illustrations at
a higher quality setting time out, raise `maxDuration` in
`app/api/stories/[storyId]/scenes/[sceneId]/image/route.ts` (and the 50-second client
timeout in `lib/server/ai.ts`); that needs Fluid Compute or a paid plan.

## Costs and limits

One turn is one short narration plus one illustration. With the defaults (`gpt-6-luna`,
`gpt-image-2.6-flare` at `low` quality, 1024×1024) a turn should cost well under one US
cent, almost all of it the picture. OpenAI bills these image models by token rather than
per image, so check the usage page after your first few stories for the real figure.
`OPENAI_IMAGE_QUALITY=medium` looks better and costs several times more.

Budgets are counted per rolling 24 hours and enforced in the database:

| Setting | Default | Meaning |
| --- | --- | --- |
| `QUOTA_GUEST_TURNS_PER_DAY` | 25 | per guest |
| `QUOTA_MEMBER_TURNS_PER_DAY` | 150 | per signed-in member |
| `QUOTA_GLOBAL_TURNS_PER_DAY` | 1500 | everyone combined: your worst-case daily spend |

Each scene gets at most three attempts at its illustration, and a story ends at 60 scenes.

## Sharing

Stories are private. The author can switch on **Share** to make a read-only link: anyone
with it sees the finished book, and nobody but the author can add to it. Shared stories
also get a title and cover image in link previews. Switching sharing off makes the link
stop working.

## Troubleshooting

| What you see | Likely cause |
| --- | --- |
| "DreamWeaver is not configured yet" | The two `NEXT_PUBLIC_SUPABASE_*` values were missing when the app was built. Add them and redeploy. |
| "Guest sessions are switched off" | Anonymous sign-ins are not enabled (step 1.3). |
| "Server is missing …" on starting a story | `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` is not set on the server. |
| Stories load but nothing can be created; errors mention `consume_quota` or `scenes` | `supabase/schema.sql` has not been run on this project. |
| "The illustrator couldn't paint this scene" | OpenAI refused or timed out. Use **Paint it** to retry; check the function logs if it keeps happening. An unknown model name in `OPENAI_IMAGE_MODEL` also shows up here. |
| "The storyteller lost the thread" | The narration call failed; the function logs have the reason. If you changed `OPENAI_TEXT_MODEL` to a model that rejects `reasoning_effort`, set `OPENAI_TEXT_REASONING_EFFORT=default`. |

## Upgrading from the original app

Running `supabase/schema.sql` on the original database:

- renames `stories.story_id` to `legacy_id`; links using an old short id (`/story/abc123xyz`)
  redirect to the story's new address;
- converts each story's `messages` and `story_images` into rows in the new `scenes` table,
  dropping stuck "Weaving your tale…" bubbles, duplicated actions and expired OpenAI image links;
- keeps stories that had no owner readable by link (as before) and marks them shared;
  stories with an owner stay private to that owner;
- replaces all the old access policies, including the ones that let anyone edit
  ownerless stories or upload to the image bucket.

The old columns (`messages`, `message_history`, `story_images`, `possible_actions`,
`img_url`, `is_anonymous`) are left in place as a backup and are no longer used. Once you
are happy with the result you can drop them.

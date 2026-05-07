# Vercel Deployment Setup

DreamWeaver runs on **Next.js 15 (App Router)** with serverless Route Handlers under
`app/api/*`. Vercel auto-detects the framework — no `vercel.json` is required.

## Required environment variables

In your Vercel project: **Settings → Environment Variables**, add the following.
Apply each to **Production**, **Preview**, and **Development**.

### Public (browser-safe)

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-id>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your Supabase anon key) |

### Server-only (NEVER prefix with `NEXT_PUBLIC_`)

| Key | Required? | Value |
| --- | --- | --- |
| `OPENAI_API_KEY` | **yes** | `sk-...` — your OpenAI key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role key, used by `/api/upload-image` and `/api/stories/[id]` for ownership checks and cascade deletes |
| `OPENAI_CHAT_MODEL` | optional | defaults to `gpt-4o-mini` |
| `OPENAI_IMAGE_MODEL` | optional | defaults to `dall-e-3` |
| `ALLOWED_IMAGE_HOST` | optional | defaults to `oaidalleapiprodscus.blob.core.windows.net` (OpenAI image CDN) |
| `ELEVENLABS_API_KEY` | optional | only if you re-enable TTS |

> **Backwards-compatible:** the code also accepts the legacy `REACT_APP_SUPABASE_URL`
> and `REACT_APP_SUPABASE_ANON_KEY` names during migration so an existing Vercel
> project keeps working without immediate changes.

## After configuring

1. Save each variable in the Vercel dashboard.
2. Push the branch (or **Redeploy** an existing deployment) so the new env values take effect.
3. Verify a fresh deploy by:
   - Creating a story (chat + image generation should work).
   - Opening the browser network tab — confirm calls go to `/api/chat`, `/api/image`, and `/api/upload-image`. **No** direct calls to `api.openai.com` should appear from the browser.
   - Confirming files appear in the Supabase Storage `story-images` bucket.

## Common issues

### `Server configuration error: Missing Supabase credentials`
You're missing `SUPABASE_SERVICE_ROLE_KEY` (or the Supabase URL/anon vars).

### `Image host not allowed`
The `/api/upload-image` endpoint allowlists OpenAI's image CDN by default. If
OpenAI changes hosts, set `ALLOWED_IMAGE_HOST` accordingly.

### `OpenAI API quota exceeded`
Check your OpenAI billing dashboard.

# DreamWeaver

An interactive AI storybook. Players describe a setting; GPT narrates a Zork-style
adventure and DALL-E illustrates each scene. Built on Next.js 15 + Supabase.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** for auth + Postgres + Storage
- **OpenAI** for chat + image generation, called server-side only
- **turn.js** for the realistic page-flip BookView
- Deployed on **Vercel**

## Local development

```bash
cp .env.example .env.local        # then fill in your keys
npm install
npm run dev                       # http://localhost:3000
```

## Environment variables

See [`VERCEL_SETUP.md`](./VERCEL_SETUP.md) for the full list. In summary:

- Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## First-time Supabase setup

Open the SQL Editor in your Supabase project and run
[`supabase/migrations/001_initial.sql`](./supabase/migrations/001_initial.sql).
That creates the schema, RLS, and Storage policies. Then create a public Storage
bucket named `story-images`.

See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) and
[`STORAGE_TROUBLESHOOTING.md`](./STORAGE_TROUBLESHOOTING.md) for deeper details.

## Project layout

```
app/                   Next.js App Router
  api/
    chat/              POST /api/chat   — server-side OpenAI chat
    image/             POST /api/image  — server-side DALL-E
    random-setting/    POST /api/random-setting
    stories/[id]/      DELETE /api/stories/[id] — cascade delete (row + images)
    upload-image/      POST /api/upload-image   — fetch OpenAI image, upload to Supabase
  page.tsx             Landing
  story/[storyId]/     Story page (URL-routable now)
  dashboard/           User dashboard
components/
  auth/                AuthProvider, AuthModal
  story/               Story sub-components + BookView
  ui/                  ErrorBoundary, etc.
hooks/
  useStoryEngine.ts    Single source of truth for story state
lib/
  api.ts               Client-side helpers that call /api/*
  env.ts               Centralised env access (with REACT_APP_ fallback)
  openai.ts            Server-only OpenAI client
  prompt.ts            System prompt + JSON schema for structured outputs
  storyId.ts           crypto.randomUUID() helpers
  storyService.ts      Supabase client-side reads/writes
  supabase/
    client.ts          Browser Supabase client
    server.ts          Server Supabase clients (anon + service_role)
  anonStore.ts         localStorage of anon-owner tokens
types/
  story.ts             Shared TypeScript types
supabase/
  migrations/          SQL migrations
```

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |

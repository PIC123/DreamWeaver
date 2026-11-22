# DreamWeaver

An interactive, illustrated storybook. Describe a setting, then steer the story one
choice at a time: an AI narrator writes each scene and an AI illustrator paints it.
Read it back as a picture book with turning pages, and share it with a link.

## How it works

- **Next.js 16** (App Router, TypeScript, React 19), deployed on Vercel.
- **Supabase** for accounts, the database and image storage.
- **OpenAI** for narration (`gpt-6-luna`), illustration (`gpt-image-2.6-flare`) and moderation.

Every visitor gets a guest session automatically, so they can start writing straight
away. Signing up later keeps everything they wrote as a guest.

The browser only ever **reads** from Supabase (its own stories and shared ones). Every
write, and every call to OpenAI, goes through the API routes in `app/api`, which check
who is asking, enforce daily budgets, and build the prompts themselves.

```
app/
  page.tsx                      landing: start a story
  dashboard/                    your bookshelf
  story/[storyId]/              play a story, or read a shared one
  auth/reset/                   password reset landing page
  api/
    stories/                    POST   create a story
    stories/[id]/               PATCH  share on/off · DELETE (also removes pictures)
    stories/[id]/turns/         POST   write the next scene (streams the narration)
    stories/[id]/scenes/[id]/image/   POST   paint a scene's illustration
    random-setting/             POST   "surprise me" setting
    claim/                      POST   move guest stories into an account
components/                     auth, story screens, the page-turning book
hooks/useStory.ts               all story state for the screens
lib/story/                      prompts, story bible, types, streaming-JSON reader (shared)
lib/server/                     auth, quotas, OpenAI and database helpers (server only)
supabase/schema.sql             the whole database: tables, access rules, storage
tests/                          unit, database and end-to-end tests
```

## Setup

See **[docs/SETUP.md](docs/SETUP.md)** for the full walkthrough. In short:

1. In Supabase: run `supabase/schema.sql` in the SQL Editor, and turn on
   **Allow anonymous sign-ins** (Authentication → Sign In / Providers).
2. Copy `.env.example` to `.env.local` and fill in the four required values.
3. `npm install && npm run dev`, then open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:db` | Applies `supabase/schema.sql` to a scratch Postgres and checks the access rules and the upgrade path |
| `npm run test:e2e` | Browser tests of the whole app against local stand-ins (no real API keys needed) |

`test:db` and `test:e2e` need a local Postgres (`PGADMIN_URL`, default
`postgresql://postgres:postgres@127.0.0.1:5432/postgres`); `test:e2e` also needs a
[PostgREST](https://github.com/PostgREST/postgrest/releases) binary on your `PATH`
(or `POSTGREST_BIN`). CI runs all of it on every push; see `.github/workflows/ci.yml`.

## Licence

MIT. See [LICENSE](LICENSE).

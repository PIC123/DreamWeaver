# What changed in this branch

**Branch:** `claude/review-dreamweaver-app-xBicv`

This is a foundation rewrite. The product/UX is unchanged — the page still looks
the same, the BookView still flips, the dashboard still lists stories. Under the
hood almost everything is different.

## Manual steps before this branch will run

1. **Install fresh dependencies** locally (or trust Vercel's install): `npm install`.
2. **Copy `.env.example` → `.env.local`** and fill in the new values.
3. **Add new env vars to Vercel** (Production + Preview):
   - `OPENAI_API_KEY` (server-only, NEW — required)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, NEW — required)
   - `NEXT_PUBLIC_SUPABASE_URL` (rename of existing `REACT_APP_SUPABASE_URL` — also accepted via fallback)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (rename of existing `REACT_APP_SUPABASE_ANON_KEY` — also accepted via fallback)
4. **Run the SQL migration** in your Supabase SQL Editor: `supabase/migrations/001_initial.sql`.
   It's idempotent and safely upgrades the existing table — but it does tighten
   policies so old anonymous clients won't be able to update their stories until
   they re-create them under the new flow.
5. **Rotate the `REACT_APP_OPENAI_API_KEY`** — the old key has been in browser
   bundles, so anyone who's used your site has it. Generate a new one for the
   `OPENAI_API_KEY` env var.
6. **Deploy.** Vercel auto-detects Next.js — no `vercel.json` needed.

## Security

- ✅ OpenAI + ElevenLabs API keys removed from client bundle.
- ✅ All OpenAI calls now go through Next.js Route Handlers (`/api/chat`, `/api/image`, `/api/random-setting`).
- ✅ `/api/upload-image` now: requires auth (or anon-token match), allowlists the
  OpenAI image host (anti-SSRF), caps body size, has a fetch timeout.
- ✅ `/api/stories/[id]` cascades delete — removes Storage objects when a story is deleted.
- ✅ RLS tightened: anonymous rows are no longer updatable via the anon key. Only
  service-role server endpoints (which check the anon-token) can update them.
- ✅ Storage policies tightened.
- ✅ Story IDs use `crypto.randomUUID()` (was `Math.random().toString(36).substr(2, 9)`).
- ✅ Anonymous owners now hold a per-story `anon_token` in `localStorage` so they
  keep edit access across sessions and across devices that sync localStorage.
- ✅ Security headers added to `next.config.mjs` (HSTS, X-Frame-Options, etc.).
- ✅ Live Supabase JWT scrubbed from `VERCEL_SETUP.md`.

## Bug fixes (from the review)

- ✅ `messageHistory.push(...)` → proper immutable state updates inside `useStoryEngine`.
- ✅ BookView sender mismatch fixed (`sender === 'user'` → `'human'`).
- ✅ `location.state.setting` direct-nav crash fixed — story page reads from URL params.
- ✅ `React.StrictMode` re-enabled (default in Next.js).
- ✅ `onKeyPress` → `onKeyDown` everywhere.
- ✅ `String.prototype.substr` → safer ID generator.
- ✅ Dead `handleSpeech` + stray module-level `console.log`s removed.
- ✅ Boilerplate `App.test.js` (failed) removed.
- ✅ JSON.parse footgun replaced by structured outputs (`response_format: { type: 'json_schema' }`).
- ✅ `.star` divs no longer mutated into the DOM imperatively — rendered through React.
- ✅ Stories are URL-routable now: `/story/[storyId]`.
- ✅ ErrorBoundary at the root layout.

## Architecture / code quality

- ✅ CRA → Next.js 15 (App Router).
- ✅ JS → TypeScript everywhere.
- ✅ ESLint (Next + Prettier) + Prettier configs added.
- ✅ Centralised env access (`lib/env.ts`) with backwards-compat for `REACT_APP_*`.
- ✅ `Story.js` (583 lines) decomposed into `useStoryEngine` hook + 5 small components.
- ✅ Two parallel "message" formats unified — single source of truth in the engine hook.
- ✅ Hyphenated JSON keys (`story-text`, `dall-e-prompt`) translated at the API
  boundary; the rest of the code uses camelCase.
- ✅ Default chat model bumped to `gpt-4o-mini`. Override via `OPENAI_CHAT_MODEL`.
- ✅ Removed deprecated `react-scripts`, `dotenv`, `web-vitals`, `jquery` (loaded
  on-demand via `next/script`), `react-router-dom`.
- ✅ Removed `func-sample.py` (Azure leftover) and `public/turn.js-master/demos/`
  (1.4MB of unused demo assets).

## What I deliberately didn't do

- **Did not** replace turn.js with `react-pageflip` — your commit history shows
  you've been back and forth on this; I left the proven one in place. The old
  `BookView` still works, and the bug it had was fixable directly.
- **Did not** add Sentry — needs a DSN you'd have to create.
- **Did not** add a GitHub Actions workflow — left as a follow-up; one-line
  `next lint && next typecheck` job, but the repo's CI conventions are yours.
- **Did not** stream chat completions yet. The structured-output JSON fits one
  shot well; streaming would mean parsing partial JSON which is more work.
  Easy to add later.
- **Did not** trim or split the large CSS files — they still work as-is.

## Future improvements I'd recommend next

- Stream chat responses (SSE) for instant feedback.
- Replace turn.js + jQuery with a pure-React 3D-flip CSS solution.
- Lazy-load Dashboard + BookView + AuthModal via `dynamic()`.
- Add Sentry or PostHog for error/usage tracking.
- Add a basic GitHub Actions workflow.
- Mobile pass — the split-pane layout in `Story.css` won't fit phones well.
- Accessibility pass — focus traps in modals, more aria-labels.

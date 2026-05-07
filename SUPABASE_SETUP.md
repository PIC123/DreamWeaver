# Supabase Setup

This guide covers the Supabase configuration DreamWeaver needs. Run the SQL in
`supabase/migrations/001_initial.sql` against your Supabase project's SQL Editor —
it's idempotent and contains the schema, RLS policies, and Storage policies.

## 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com).
2. Create a project. Save the **Project URL**, **anon public key**, and
   **service_role key** (Settings → API).
3. Add those values to your `.env.local` and to Vercel env vars
   (see [`VERCEL_SETUP.md`](./VERCEL_SETUP.md)).

## 2. Run the schema migration

Open Supabase SQL Editor → New Query → paste the contents of
`supabase/migrations/001_initial.sql` → **Run**.

This creates:

- The `public.stories` table (with `anon_token` for anonymous-owner identity).
- Indexes and an `updated_at` trigger.
- RLS policies that close the previous "anyone-can-update-anonymous-stories" hole.
- Storage policies on the `story-images` bucket that require either the row's
  owner or a server-side service-role write.

## 3. Create the Storage bucket

1. **Storage → New bucket → `story-images`** (Public).
2. The migration above adds the SELECT/INSERT/UPDATE/DELETE policies the app needs.

## 4. Confirm authentication works

`Authentication → Providers → Email` — leave defaults. For local development you
may want to disable email confirmation.

## Troubleshooting

- **`new row violates row-level security policy`** — the migration didn't run. Re-run
  `supabase/migrations/001_initial.sql`.
- **`Bucket not found`** — create `story-images` (public). Re-run the migration to
  attach the policies.
- **`Forbidden` on upload-image / delete** — the caller isn't authenticated AND the
  story isn't anonymous (or the anon token doesn't match). For an anon story, make
  sure the browser still has the token in `localStorage` under the
  `dw.anon.tokens.v1` key.

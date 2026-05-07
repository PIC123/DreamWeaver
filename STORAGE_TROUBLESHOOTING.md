# Storage Troubleshooting

The image-upload flow is now:

```
client → /api/upload-image (Next.js Route Handler)
        ↳ ownership check (auth user OR anon_token match)
        ↳ host allowlist + size cap on the OpenAI image URL
        ↳ uploads to Supabase Storage as service_role
```

So uploads should "just work" once the schema migration has been run and the
following env vars are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Diagnosis quickstart

1. Check the browser console — image-upload errors include the server's response.
2. Check the Vercel function logs (Vercel dashboard → Logs).
3. Confirm the `story-images` bucket exists in Supabase and is public.
4. Confirm RLS / Storage policies match `supabase/migrations/001_initial.sql`.

## Common errors

| Error | Cause | Fix |
| --- | --- | --- |
| `Image host not allowed` | OpenAI changed image CDN host | set `ALLOWED_IMAGE_HOST` env var |
| `Image too large` | Image > 10MB | adjust `MAX_BYTES` in `app/api/upload-image/route.ts` if needed |
| `Forbidden` | Caller isn't the owner | sign in, or ensure the device has the anon token in `localStorage` |
| `Server config error: SUPABASE_SERVICE_ROLE_KEY is not set` | Missing env var on the server | add it in Vercel env vars |
| `Bucket not found` | Storage bucket missing | create `story-images` and re-run the migration |

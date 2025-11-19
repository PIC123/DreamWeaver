# Vercel Deployment Setup

## Required Environment Variables

**CRITICAL**: The serverless image upload function requires Supabase credentials to be configured in Vercel.

### Steps to Configure:

1. Go to your Vercel project dashboard:
   ```
   https://vercel.com/pic123s-projects/interactive-storybook/settings/environment-variables
   ```

2. Add the following environment variables:

   **Variable 1:**
   - Key: `REACT_APP_SUPABASE_URL`
   - Value: `https://xjvwujgmngzvmaxhauto.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Key: `REACT_APP_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqdnd1amdtbmd6dm1heGhhdXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Mjg1MTEsImV4cCI6MjA3OTAwNDUxMX0.YWLD7uRL9IsEIkYXmTFsFu6mmoIheA1HIcAgkIFdGVo`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. Click **Save** for each variable

4. **Redeploy** your application:
   ```bash
   vercel --prod
   ```

## Why These Are Needed

The `/api/upload-image` serverless function needs to:
1. Fetch images from OpenAI (server-side to avoid CORS)
2. Upload them to your Supabase Storage bucket
3. Return permanent Supabase URLs

Without these credentials, the function will return:
```
Server configuration error: Missing Supabase credentials
```

## Testing After Setup

After configuring and redeploying:

1. Create a new story
2. Open browser console (F12)
3. Look for these logs:
   - 🖼️ Starting image upload...
   - ✅ Image uploaded successfully
   - ✅ Public URL: https://xjvwujgmngzvmaxhauto.supabase.co/storage/v1/object/public/story-images/...

4. Check Supabase Storage dashboard:
   - Go to Storage → story-images bucket
   - Verify files are appearing

## Common Issues

### Error: "Missing Supabase credentials"
- **Solution**: Environment variables not set in Vercel. Follow steps above.

### Error: "Failed to fetch image"
- **Solution**: OpenAI image URL may have expired. This shouldn't happen if images are processed immediately.

### Error: "Failed to upload to Supabase"
- **Solution**: Check your Supabase storage policies. See STORAGE_TROUBLESHOOTING.md

# Supabase Storage Troubleshooting Guide

## Issue: Images Not Saving to Supabase Storage

If your `story-images` bucket is empty, follow these steps to diagnose and fix the issue:

## Step 1: Verify Storage Bucket Exists

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Check if a bucket named **`story-images`** exists
4. If it doesn't exist, create it:
   - Click "New bucket"
   - Name it exactly: `story-images`
   - Make it **Public** (important!)
   - Click "Create bucket"

## Step 2: Configure Storage Policies

The bucket needs proper policies to allow uploads and public access.

### Required Policies:

#### 1. Allow Public Uploads (INSERT)
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'story-images');
```

#### 2. Allow Public Access (SELECT)
```sql
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-images');
```

#### 3. Allow Updates (UPDATE)
```sql
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'story-images');
```

### How to Add Policies:

1. In Supabase Dashboard, go to **Storage**
2. Click on the `story-images` bucket
3. Click the **Policies** tab
4. Click **New Policy**
5. For each policy above:
   - Choose operation type (INSERT, SELECT, or UPDATE)
   - Policy name: Use the names above
   - Target roles: `public`
   - Click **Review** and then **Save policy**

## Step 3: Check CORS Configuration

If you're getting CORS errors, you may need to configure CORS for the storage bucket:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Scroll to **CORS configuration**
3. Make sure your app's domain is allowed (or use `*` for testing)

## Step 4: Verify Environment Variables

Check your `.env` file has the correct Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key-here
```

**Important:** After changing `.env` file, restart your development server!

## Step 5: Test Image Upload

With the enhanced logging I just added, you can now see exactly what's happening:

1. Open your browser's Developer Console (F12)
2. Try creating a new story with an image
3. Look for console logs starting with 🖼️
4. You should see:
   - ✅ Image fetched successfully
   - ✅ Upload successful
   - ✅ Public URL generated

If you see ❌ error messages, they will tell you exactly what's wrong.

## Common Error Messages & Solutions

### Error: "new row violates row-level security policy"
**Solution:** The storage policies aren't configured correctly. Follow Step 2 above.

### Error: "Bucket not found"
**Solution:** Create the `story-images` bucket. Follow Step 1 above.

### Error: "Failed to fetch image"
**Solution:** OpenAI image URL has expired or CORS is blocking. This shouldn't happen if images are processed immediately.

### Error: "The resource already exists"
**Solution:** This is normal when using `upsert: true`. The image is being updated, not creating a new one.

## Quick Test Using Supabase UI

To verify the bucket is working:

1. Go to **Storage** → **story-images** bucket
2. Try manually uploading a test image
3. If this works, the bucket configuration is correct
4. If it fails, check the policies in Step 2

## Verification Checklist

- [ ] `story-images` bucket exists and is public
- [ ] INSERT policy allows public uploads
- [ ] SELECT policy allows public access
- [ ] UPDATE policy allows public updates
- [ ] Environment variables are correct in `.env`
- [ ] Development server restarted after `.env` changes
- [ ] Browser console shows detailed upload logs

## Still Not Working?

If you've followed all steps and it's still not working:

1. Check the browser console for the detailed error logs
2. Copy the exact error message
3. Check if the Supabase service is operational
4. Verify your Supabase project hasn't hit storage limits

## Success Indicators

You'll know it's working when:
- ✅ Console shows "Upload successful"
- ✅ Files appear in the `story-images` bucket in Supabase dashboard
- ✅ Story table shows Supabase URLs (not OpenAI URLs) in `story_images` column
- ✅ Images load correctly after page refresh

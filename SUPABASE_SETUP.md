# Supabase Setup Guide for DreamWeaver

This guide will help you set up Supabase for authentication and story storage.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: `dreamweaver` (or any name you prefer)
   - Database Password: Create a strong password
   - Region: Choose the closest region to you
4. Click "Create new project" and wait for it to be ready (1-2 minutes)

## 2. Get Your API Credentials

1. In your Supabase project dashboard, click on the "Settings" icon (gear icon) in the sidebar
2. Click on "API" under Project Settings
3. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

4. Copy these values - you'll need them next

## 3. Set Up Environment Variables

1. Create a `.env` file in the root of your project (next to package.json)
2. Add the following:

```env
# OpenAI API Key (existing)
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (new)
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_public_key_here
```

3. Replace the placeholder values with your actual Supabase credentials

## 4. Create Database Tables

1. In your Supabase project, click on the "SQL Editor" icon in the sidebar
2. Click "New query"
3. Copy and paste the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stories table
CREATE TABLE public.stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id TEXT UNIQUE NOT NULL,
  setting TEXT,
  img_url TEXT,
  story_images JSONB DEFAULT '[]'::jsonb,
  message_history JSONB DEFAULT '[]'::jsonb,
  messages JSONB DEFAULT '[]'::jsonb,
  possible_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_anonymous BOOLEAN DEFAULT false
);

-- Create index on story_id for faster lookups
CREATE INDEX idx_stories_story_id ON public.stories(story_id);

-- Create index on user_id for faster user story queries
CREATE INDEX idx_stories_user_id ON public.stories(user_id);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own stories
CREATE POLICY "Users can view own stories"
  ON public.stories
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_anonymous = true
  );

-- Policy: Users can insert their own stories
CREATE POLICY "Users can create own stories"
  ON public.stories
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    is_anonymous = true
  );

-- Policy: Users can update their own stories
CREATE POLICY "Users can update own stories"
  ON public.stories
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    is_anonymous = true
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_anonymous = true
  );

-- Policy: Users can delete their own stories
CREATE POLICY "Users can delete own stories"
  ON public.stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" to execute the SQL

## 5. Set Up Storage for Images

1. In your Supabase project, click on the "Storage" icon in the sidebar
2. Click "Create a new bucket"
3. Name it: `story-images`
4. Make it **Public** (check the "Public bucket" option)
5. Click "Create bucket"

6. Set up storage policies:
   - Click on the `story-images` bucket
   - Go to "Policies" tab
   - Add the following policies:

**Policy for SELECT (Read):**
- Policy name: `Public can read story images`
- Target roles: `public`
- WITH CHECK expression: `true`

**Policy for INSERT (Upload):**
- Policy name: `Authenticated users can upload images`
- Target roles: `authenticated`
- WITH CHECK expression: `true`

## 6. Configure Email Authentication (Optional)

By default, Supabase requires email confirmation for new signups.

**Option A: Keep Email Confirmation (Recommended for production)**
- Users will receive a confirmation email when they sign up
- You can customize the email template in: Authentication → Email Templates

**Option B: Disable Email Confirmation (For development/testing)**
1. Go to Authentication → Settings
2. Under "Email Auth", toggle OFF "Enable email confirmations"
3. This allows users to sign in immediately after signup

## 7. Test Your Setup

1. Restart your development server: `npm start`
2. Go to the landing page
3. Click "Sign Up" in the top right
4. Create a test account
5. Check that you can sign in and see your email in the user menu

## Next Steps

- Update Story.js to save stories to Supabase instead of Azure
- Create a user dashboard to view all saved stories
- Set up image storage to use Supabase Storage

## Troubleshooting

**Can't connect to Supabase:**
- Check that your `.env` file has the correct values
- Make sure you restart your development server after adding environment variables
- Verify the URL starts with `https://` and ends with `.supabase.co`

**Authentication not working:**
- Check the browser console for errors
- Verify your anon key is correct
- Make sure Row Level Security policies are enabled

**Database queries failing:**
- Check that all tables were created successfully in the SQL Editor
- Verify Row Level Security policies are in place
- Check the Supabase dashboard logs for detailed error messages

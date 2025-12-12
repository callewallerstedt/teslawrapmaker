# Supabase Setup Guide for TeslaWrapMaker

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: teslawrapmaker (or your choice)
   - **Database Password**: (choose a strong password - save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (keep this secret!)

## Step 3: Create Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 4: Create Database Tables

Go to **SQL Editor** in Supabase and run this SQL:

```sql
-- Create wraps table
CREATE TABLE wraps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_model_id TEXT NOT NULL,
  texture_url TEXT NOT NULL,
  preview_render_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  username TEXT,
  likes INTEGER DEFAULT 0,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_wraps_created_at ON wraps(created_at DESC);
CREATE INDEX idx_wraps_likes ON wraps(likes DESC);
CREATE INDEX idx_wraps_car_model ON wraps(car_model_id);

-- Enable Row Level Security (RLS)
ALTER TABLE wraps ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read wraps
CREATE POLICY "Anyone can view wraps" ON wraps
  FOR SELECT USING (true);

-- Policy: Anyone can create wraps (for now, can restrict later)
CREATE POLICY "Anyone can create wraps" ON wraps
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update likes
CREATE POLICY "Anyone can update likes" ON wraps
  FOR UPDATE USING (true)
  WITH CHECK (true);
```

## Step 5: Create Storage Bucket

1. Go to **Storage** in Supabase
2. Click **New bucket**
3. Name: `wraps`
4. Make it **Public** (so images can be accessed)
5. Click **Create bucket**

6. Go to **Policies** tab for the `wraps` bucket
7. Add policy:
   - **Policy name**: Public read access
   - **Allowed operation**: SELECT
   - **Policy definition**: `true`
   - **Target roles**: `public`

8. Add another policy:
   - **Policy name**: Public upload access
   - **Allowed operation**: INSERT
   - **Policy definition**: `true`
   - **Target roles**: `public`

## Step 6: Install Supabase Client

Run in your terminal:
```bash
npm install @supabase/supabase-js
```

## Step 7: Update Code

The code has been updated in:
- `lib/supabase.ts` - Supabase client setup
- `lib/db.ts` - Database functions using Supabase
- `app/api/publish/route.ts` - Upload to Supabase Storage

## Step 8: Test

1. Start your dev server: `npm run dev`
2. Create a wrap and publish it
3. Check Supabase dashboard → **Table Editor** → `wraps` to see your data
4. Check **Storage** → `wraps` bucket to see uploaded images

## Troubleshooting

- **"Invalid API key"**: Check your `.env.local` file has correct keys
- **"Bucket not found"**: Make sure bucket is named exactly `wraps` and is public
- **"RLS policy violation"**: Check your RLS policies are set correctly
- **Images not loading**: Make sure storage bucket is public and policies allow SELECT


// Setup script to create Supabase table and storage bucket
// Run with: npx tsx scripts/setup-supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('Creating wraps table...')
  
  const createTableSQL = `
    -- Create wraps table
    CREATE TABLE IF NOT EXISTS wraps (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      car_model_id TEXT NOT NULL,
      texture_url TEXT NOT NULL,
      preview_render_url TEXT,
      title TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      author_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_wraps_created_at ON wraps(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_wraps_likes ON wraps(likes DESC);
    CREATE INDEX IF NOT EXISTS idx_wraps_car_model ON wraps(car_model_id);

    -- Enable Row Level Security (RLS)
    ALTER TABLE wraps ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view wraps" ON wraps;
    DROP POLICY IF EXISTS "Anyone can create wraps" ON wraps;
    DROP POLICY IF EXISTS "Anyone can update likes" ON wraps;

    -- Policy: Anyone can read wraps
    CREATE POLICY "Anyone can view wraps" ON wraps
      FOR SELECT USING (true);

    -- Policy: Anyone can create wraps
    CREATE POLICY "Anyone can create wraps" ON wraps
      FOR INSERT WITH CHECK (true);

    -- Policy: Anyone can update likes
    CREATE POLICY "Anyone can update likes" ON wraps
      FOR UPDATE USING (true)
      WITH CHECK (true);
  `

  const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
  
  if (error) {
    // Try direct SQL execution via REST API
    console.log('Trying alternative method...')
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: createTableSQL })
    })

    if (!response.ok) {
      console.error('Could not create table via API. Please run the SQL manually in Supabase SQL Editor.')
      console.log('\nSQL to run:')
      console.log(createTableSQL)
      return false
    }
  }

  console.log('✅ Table created successfully!')
  return true
}

async function setupStorage() {
  console.log('Creating storage bucket...')
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('Error listing buckets:', listError)
    return false
  }

  const bucketExists = buckets?.some(b => b.name === 'wraps')
  
  if (bucketExists) {
    console.log('✅ Bucket "wraps" already exists!')
  } else {
    // Create bucket
    const { data, error } = await supabase.storage.createBucket('wraps', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    })

    if (error) {
      console.error('Error creating bucket:', error)
      console.log('\nPlease create the bucket manually:')
      console.log('1. Go to Storage → New bucket')
      console.log('2. Name: wraps')
      console.log('3. Make it Public')
      console.log('4. Create bucket')
      return false
    }

    console.log('✅ Bucket created successfully!')
  }

  // Set up policies
  console.log('Setting up storage policies...')
  
  // Note: Storage policies need to be set manually in Supabase dashboard
  // as the API doesn't support policy creation directly
  console.log('\n⚠️  Please set up storage policies manually:')
  console.log('1. Go to Storage → wraps bucket → Policies')
  console.log('2. Add SELECT policy: true for public role')
  console.log('3. Add INSERT policy: true for public role')
  
  return true
}

async function main() {
  console.log('🚀 Setting up Supabase for TeslaWrapMaker...\n')
  
  const tableCreated = await setupDatabase()
  const storageCreated = await setupStorage()
  
  console.log('\n' + '='.repeat(50))
  if (tableCreated && storageCreated) {
    console.log('✅ Setup complete!')
    console.log('\n⚠️  Don\'t forget to set up storage policies manually in the dashboard.')
  } else {
    console.log('⚠️  Some steps need manual completion. See instructions above.')
  }
  console.log('='.repeat(50))
}

main().catch(console.error)







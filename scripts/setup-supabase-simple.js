// Simple setup script using Supabase REST API
// Run with: node scripts/setup-supabase-simple.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rhuapkeirnhsviephydm.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_RfAl99CBjTgqQt1qXv2WHw_0JX7HsrF'

async function setupSupabase() {
  console.log('🚀 Setting up Supabase...\n')

  // Create table via SQL
  console.log('Creating wraps table...')
  const sql = `
    CREATE TABLE IF NOT EXISTS wraps (
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

    CREATE INDEX IF NOT EXISTS idx_wraps_created_at ON wraps(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_wraps_likes ON wraps(likes DESC);
    CREATE INDEX IF NOT EXISTS idx_wraps_car_model ON wraps(car_model_id);

    ALTER TABLE wraps ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view wraps" ON wraps;
    DROP POLICY IF EXISTS "Anyone can create wraps" ON wraps;
    DROP POLICY IF EXISTS "Anyone can update likes" ON wraps;

    CREATE POLICY "Anyone can view wraps" ON wraps FOR SELECT USING (true);
    CREATE POLICY "Anyone can create wraps" ON wraps FOR INSERT WITH CHECK (true);
    CREATE POLICY "Anyone can update likes" ON wraps FOR UPDATE USING (true) WITH CHECK (true);
  `

  // Note: We can't execute SQL via REST API easily, so we'll use the Management API
  // For now, let's create the storage bucket which we CAN do via API
  
  console.log('Creating storage bucket...')
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        name: 'wraps',
        public: true,
        allowed_mime_types: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        file_size_limit: 10485760
      })
    })

    if (response.ok) {
      console.log('✅ Storage bucket created!')
    } else if (response.status === 409) {
      console.log('✅ Storage bucket already exists!')
    } else {
      const error = await response.text()
      console.log('⚠️  Could not create bucket:', error)
      console.log('Please create it manually in the dashboard')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 NEXT STEPS:')
  console.log('='.repeat(60))
  console.log('\n1. Go to: https://supabase.com/dashboard/project/rhuapkeirnhsviephydm/sql/new')
  console.log('\n2. Copy and paste this SQL:')
  console.log('\n' + sql)
  console.log('\n3. Click "Run" to execute')
  console.log('\n4. Go to Storage → wraps bucket → Policies')
  console.log('   Add SELECT policy: true for public')
  console.log('   Add INSERT policy: true for public')
  console.log('\n✅ Then restart your dev server!')
  console.log('='.repeat(60))
}

setupSupabase()


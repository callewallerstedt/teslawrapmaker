// Direct SQL execution script
const SUPABASE_URL = 'https://rhuapkeirnhsviephydm.supabase.co'
const SUPABASE_KEY = 'sb_secret_RfAl99CBjTgqQt1qXv2WHw_0JX7HsrF'

const sql = `
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

async function createTable() {
  console.log('Attempting to create table via Supabase API...\n')
  
  // Try using the Management API endpoint
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    })

    const result = await response.text()
    console.log('Response:', result)
    
    if (response.ok) {
      console.log('✅ Table created successfully!')
      return true
    }
  } catch (error) {
    console.log('API method not available, using manual method...\n')
  }

  // Fallback: provide instructions
  console.log('='.repeat(70))
  console.log('📋 MANUAL SETUP REQUIRED')
  console.log('='.repeat(70))
  console.log('\n1. Open: https://supabase.com/dashboard/project/rhuapkeirnhsviephydm/sql/new')
  console.log('\n2. Copy and paste this SQL:\n')
  console.log(sql)
  console.log('\n3. Click "Run" button')
  console.log('\n4. Verify table was created in Table Editor')
  console.log('\n✅ Storage bucket already created!')
  console.log('='.repeat(70))
  
  return false
}

createTable()







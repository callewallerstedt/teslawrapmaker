// Create wraps table using Supabase client
// Run with: node scripts/create-table.js

import('@supabase/supabase-js').then(({ createClient }) => {
  const supabaseUrl = 'https://rhuapkeirnhsviephydm.supabase.co'
  const supabaseKey = 'sb_secret_RfAl99CBjTgqQt1qXv2WHw_0JX7HsrF'

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

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

  // Execute SQL via REST API
  fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({ query: sql })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Table creation result:', data)
  })
  .catch(err => {
    console.log('Note: SQL execution via API may not be available.')
    console.log('Please run the SQL manually in Supabase SQL Editor:')
    console.log('\n' + sql)
  })
})


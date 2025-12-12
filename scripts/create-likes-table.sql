-- Create likes tracking table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wrap_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wrap_id UUID NOT NULL REFERENCES wraps(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wrap_id, ip_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wrap_likes_wrap_id ON wrap_likes(wrap_id);
CREATE INDEX IF NOT EXISTS idx_wrap_likes_ip ON wrap_likes(ip_address);

-- Enable RLS
ALTER TABLE wrap_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert likes
CREATE POLICY "Anyone can like wraps" ON wrap_likes
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read likes (for checking)
CREATE POLICY "Anyone can view likes" ON wrap_likes
  FOR SELECT USING (true);


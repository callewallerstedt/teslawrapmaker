-- Migration: Add description and username columns to wraps table
-- Run this in Supabase SQL Editor if you already created the table

ALTER TABLE wraps 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;







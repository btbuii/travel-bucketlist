-- ============================================
-- Add description column to cities
-- Run this in your Supabase SQL Editor
-- ============================================

alter table cities add column if not exists description text default '';

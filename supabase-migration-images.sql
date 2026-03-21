-- ============================================
-- Add images array column to entries
-- Run this in your Supabase SQL Editor
-- ============================================

alter table entries add column if not exists images text[] default '{}';

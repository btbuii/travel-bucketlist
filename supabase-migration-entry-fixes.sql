-- ============================================
-- Fix entries table: half-star ratings + status column
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Change rating columns from integer to numeric to support half-stars (e.g. 4.5)
alter table entries alter column rating_taste type numeric using rating_taste::numeric;
alter table entries alter column rating_value type numeric using rating_value::numeric;
alter table entries alter column rating_experience type numeric using rating_experience::numeric;

-- 2. Add status column if it doesn't exist
alter table entries add column if not exists status text default 'bucket-list';

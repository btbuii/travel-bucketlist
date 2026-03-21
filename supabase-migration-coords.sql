-- ============================================
-- TRAVEL BUCKET LIST — Add coordinates + status
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add status column if not already done
alter table entries add column if not exists status text default 'bucket-list';

-- Add coordinate columns
alter table entries add column if not exists latitude double precision;
alter table entries add column if not exists longitude double precision;

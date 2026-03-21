-- ============================================
-- Add personal_description and notes to countries
-- Run this in your Supabase SQL Editor
-- ============================================

alter table countries add column if not exists personal_description text default '';
alter table countries add column if not exists notes text default '';

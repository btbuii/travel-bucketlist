-- ============================================
-- Add visited column to cities
-- Run this in your Supabase SQL Editor
-- ============================================

alter table cities add column if not exists visited boolean default false;

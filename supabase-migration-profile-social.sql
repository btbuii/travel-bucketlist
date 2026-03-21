-- ============================================
-- Add social links and tagline to profiles
-- Run this in your Supabase SQL Editor
-- ============================================

alter table profiles add column if not exists tagline text default '';
alter table profiles add column if not exists instagram text default '';
alter table profiles add column if not exists tiktok text default '';

-- Add bio column to profiles for the intro section
-- Run this in your Supabase SQL Editor
alter table profiles add column if not exists bio text default '';

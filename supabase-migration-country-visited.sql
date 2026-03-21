-- Add visited column to countries
-- Run this in your Supabase SQL Editor
alter table countries add column if not exists visited boolean default false;

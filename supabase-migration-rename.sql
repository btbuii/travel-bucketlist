-- ============================================
-- Rename 'Attraction' to 'Attractions' + add missing columns
-- Run this in your Supabase SQL Editor
-- ============================================

-- Update existing entries
update entries set section = 'Attractions' where section = 'Attraction';

-- Drop old constraint and add new one
alter table entries drop constraint if exists entries_section_check;
alter table entries add constraint entries_section_check check (section in ('Food', 'Attractions', 'Sights'));

-- Ensure status, latitude, longitude columns exist
alter table entries add column if not exists status text default 'bucket-list';
alter table entries add column if not exists latitude double precision;
alter table entries add column if not exists longitude double precision;

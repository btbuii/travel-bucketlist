-- ============================================
-- Add trips, gallery columns + rename Sights to Hotels
-- Run this in your Supabase SQL Editor
-- ============================================

alter table countries add column if not exists trips integer default 0;
alter table countries add column if not exists gallery text[] default '{}';

update entries set section = 'Hotels' where section = 'Sights';

alter table entries drop constraint if exists entries_section_check;
alter table entries add constraint entries_section_check check (section in ('Food', 'Attractions', 'Hotels'));

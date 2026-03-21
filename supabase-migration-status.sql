-- ============================================
-- TRAVEL BUCKET LIST — Add status column
-- Run this in your Supabase SQL Editor
-- ============================================

alter table entries add column if not exists status text default 'bucket-list';

-- If you want to enforce valid values:
-- alter table entries add constraint entries_status_check check (status in ('visited', 'bucket-list'));

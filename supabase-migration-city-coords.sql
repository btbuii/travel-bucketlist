-- Add latitude/longitude to cities for homepage map pins
-- Run this in your Supabase SQL Editor
alter table cities add column if not exists latitude numeric;
alter table cities add column if not exists longitude numeric;

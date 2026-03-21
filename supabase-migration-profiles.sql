-- ============================================
-- Multi-Profile Support Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create profiles table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text default '',
  profile_pic text default '',
  section_title text default '',
  summary_items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 2. Add user_id columns to existing tables
alter table countries add column if not exists user_id uuid references auth.users(id);
alter table cities add column if not exists user_id uuid references auth.users(id);
alter table entries add column if not exists user_id uuid references auth.users(id);

-- 3. Backfill existing data with your user id
-- UNCOMMENT the lines below and replace YOUR_USER_ID with your actual UUID from Auth > Users
-- UPDATE countries SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE cities SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE entries SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;

-- 4. Enable RLS on profiles
alter table profiles enable row level security;

create policy "Public read profiles" on profiles for select using (true);
create policy "Owner insert profiles" on profiles for insert with check (auth.uid() = id);
create policy "Owner update profiles" on profiles for update using (auth.uid() = id);
create policy "Owner delete profiles" on profiles for delete using (auth.uid() = id);

-- 5. Update RLS on countries (scope writes to owner)
drop policy if exists "Public read countries" on countries;
drop policy if exists "Auth insert countries" on countries;
drop policy if exists "Auth update countries" on countries;
drop policy if exists "Auth delete countries" on countries;

create policy "Public read countries" on countries for select using (true);
create policy "Owner insert countries" on countries for insert with check (auth.uid() = user_id);
create policy "Owner update countries" on countries for update using (auth.uid() = user_id);
create policy "Owner delete countries" on countries for delete using (auth.uid() = user_id);

-- 6. Update RLS on cities
drop policy if exists "Public read cities" on cities;
drop policy if exists "Auth insert cities" on cities;
drop policy if exists "Auth update cities" on cities;
drop policy if exists "Auth delete cities" on cities;

create policy "Public read cities" on cities for select using (true);
create policy "Owner insert cities" on cities for insert with check (auth.uid() = user_id);
create policy "Owner update cities" on cities for update using (auth.uid() = user_id);
create policy "Owner delete cities" on cities for delete using (auth.uid() = user_id);

-- 7. Update RLS on entries
drop policy if exists "Public read entries" on entries;
drop policy if exists "Auth insert entries" on entries;
drop policy if exists "Auth update entries" on entries;
drop policy if exists "Auth delete entries" on entries;

create policy "Public read entries" on entries for select using (true);
create policy "Owner insert entries" on entries for insert with check (auth.uid() = user_id);
create policy "Owner update entries" on entries for update using (auth.uid() = user_id);
create policy "Owner delete entries" on entries for delete using (auth.uid() = user_id);

-- ============================================
-- 8. INSERT YOUR PROFILE
-- Go to Supabase Dashboard > Authentication > Users
-- Copy your User UID and paste it below
-- ============================================
-- INSERT INTO profiles (id, username, display_name)
-- VALUES ('PASTE_YOUR_USER_ID_HERE', 'yourname', 'Your Display Name');
--
-- Example:
-- INSERT INTO profiles (id, username, display_name)
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'john', 'John Doe');

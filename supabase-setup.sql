-- ============================================
-- TRAVEL BUCKET LIST — Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create tables

create table countries (
  id text primary key,
  name text not null,
  flag text not null default '🌍',
  banner text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table cities (
  id text primary key,
  country_id text not null references countries(id) on delete cascade,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  city_id text not null references cities(id) on delete cascade,
  section text not null check (section in ('Food', 'Attraction', 'Sights')),
  name text not null,
  address text default '',
  image text default '',
  rating_taste int default 0 check (rating_taste between 0 and 5),
  rating_value int default 0 check (rating_value between 0 and 5),
  rating_experience int default 0 check (rating_experience between 0 and 5),
  tags text[] default '{}',
  description text default '',
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security

alter table countries enable row level security;
alter table cities enable row level security;
alter table entries enable row level security;

-- 3. Public read access (anyone can view)

create policy "Public read countries" on countries for select using (true);
create policy "Public read cities" on cities for select using (true);
create policy "Public read entries" on entries for select using (true);

-- 4. Authenticated write access (only logged-in user can modify)

create policy "Auth insert countries" on countries for insert with check (auth.role() = 'authenticated');
create policy "Auth update countries" on countries for update using (auth.role() = 'authenticated');
create policy "Auth delete countries" on countries for delete using (auth.role() = 'authenticated');

create policy "Auth insert cities" on cities for insert with check (auth.role() = 'authenticated');
create policy "Auth update cities" on cities for update using (auth.role() = 'authenticated');
create policy "Auth delete cities" on cities for delete using (auth.role() = 'authenticated');

create policy "Auth insert entries" on entries for insert with check (auth.role() = 'authenticated');
create policy "Auth update entries" on entries for update using (auth.role() = 'authenticated');
create policy "Auth delete entries" on entries for delete using (auth.role() = 'authenticated');

-- 5. Seed initial data

insert into countries (id, name, flag, banner, sort_order) values
  ('thailand', 'Thailand', '🇹🇭', 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1600&q=80', 0),
  ('usa', 'USA', '🇺🇸', 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=1600&q=80', 1),
  ('vietnam', 'Vietnam', '🇻🇳', 'https://images.unsplash.com/photo-1557750255-c76072572add?w=1600&q=80', 2),
  ('china', 'China', '🇨🇳', 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1600&q=80', 3),
  ('japan', 'Japan', '🇯🇵', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80', 4),
  ('singapore', 'Singapore', '🇸🇬', 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&q=80', 5);

insert into cities (id, country_id, name, sort_order) values
  ('bangkok', 'thailand', 'Bangkok', 0),
  ('chiang-mai', 'thailand', 'Chiang Mai', 1),
  ('pattaya', 'thailand', 'Pattaya', 2),
  ('phuket', 'thailand', 'Phuket', 3),
  ('california', 'usa', 'California', 0),
  ('new-york', 'usa', 'New York', 1),
  ('oregon', 'usa', 'Oregon', 2),
  ('boston', 'usa', 'Boston', 3),
  ('hawaii', 'usa', 'Hawaii', 4),
  ('texas', 'usa', 'Texas', 5),
  ('ho-chi-minh', 'vietnam', 'Ho Chi Minh City', 0),
  ('hoi-an', 'vietnam', 'Hoi An', 1),
  ('phu-quoc', 'vietnam', 'Phu Quoc', 2),
  ('chongqing', 'china', 'Chongqing', 0),
  ('shanghai', 'china', 'Shanghai', 1),
  ('hong-kong', 'china', 'Hong Kong', 2),
  ('tokyo', 'japan', 'Tokyo', 0),
  ('shibuya', 'japan', 'Shibuya', 1),
  ('osaka', 'japan', 'Osaka', 2),
  ('singapore-city', 'singapore', 'Singapore City', 0);

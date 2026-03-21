-- ============================================
-- TRAVEL BUCKET LIST — Supabase Storage Setup
-- Run this in your Supabase SQL Editor AFTER
-- you have run supabase-setup.sql
-- ============================================

-- 1. Add 'code' and 'description' columns to countries table
alter table countries add column if not exists code text default '';
alter table countries add column if not exists description text default '';

-- 2. Update existing countries with codes and descriptions
update countries set code = 'us', description = 'From NYC skylines to California sunsets — my American adventures and bucket list.', sort_order = 0 where id = 'usa';
update countries set code = 'th', description = 'Golden temples, night markets, and the best street food on earth.', sort_order = 1 where id = 'thailand';
update countries set code = 'vn', description = 'Ancient lanterns, endless bowls of pho, and island paradise.', sort_order = 2 where id = 'vietnam';
update countries set code = 'cn', description = 'Sizzling hotpot, neon-lit megacities, and centuries of history.', sort_order = 3 where id = 'china';
update countries set code = 'jp', description = 'Ramen runs, cherry blossoms, and the perfect blend of old and new.', sort_order = 4 where id = 'japan';
update countries set code = 'sg', description = 'Hawker heaven, futuristic gardens, and the cleanest streets I''ve walked.', sort_order = 5 where id = 'singapore';

-- 3. Create storage bucket for entry images
insert into storage.buckets (id, name, public)
values ('entry-images', 'entry-images', true)
on conflict (id) do nothing;

-- 4. Storage policies: public read, authenticated upload/delete
create policy "Public read entry images"
  on storage.objects for select
  using (bucket_id = 'entry-images');

create policy "Auth upload entry images"
  on storage.objects for insert
  with check (bucket_id = 'entry-images' and auth.role() = 'authenticated');

create policy "Auth delete entry images"
  on storage.objects for delete
  using (bucket_id = 'entry-images' and auth.role() = 'authenticated');

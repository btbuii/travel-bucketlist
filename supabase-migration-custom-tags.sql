-- Add custom_tags column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_tags jsonb DEFAULT NULL;

-- Add custom_tags column to cities table for per-city tag management
ALTER TABLE cities ADD COLUMN IF NOT EXISTS custom_tags jsonb DEFAULT NULL;

-- Add repeatability column to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS repeatability text DEFAULT '';

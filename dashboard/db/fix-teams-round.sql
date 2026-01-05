-- QUICK FIX: Add missing teams.round column
-- Run this BEFORE running full migration if you get "column round does not exist" error

-- Add round column to existing teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'round'
  ) THEN
    ALTER TABLE teams ADD COLUMN round VARCHAR(50);
    RAISE NOTICE '✅ Added missing column: teams.round';
  ELSE
    RAISE NOTICE 'ℹ️ Column teams.round already exists';
  END IF;
END $$;

-- Verify the fix
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

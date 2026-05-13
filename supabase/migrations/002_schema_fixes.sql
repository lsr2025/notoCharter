-- 002_schema_fixes.sql
-- Adds missing columns to suppliers and user_profiles.

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS mining_right_id UUID REFERENCES mining_rights(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS suppliers_mr_idx ON suppliers(mining_right_id);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

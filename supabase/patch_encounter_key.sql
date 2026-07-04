-- Encounter Key: watchtower check-in now awards a district-specific key
-- required (alongside support nodes) to start an A-tier Legendary Encounter

ALTER TABLE user_districts
  ADD COLUMN IF NOT EXISTS has_encounter_key BOOLEAN DEFAULT FALSE;

-- Backfill: existing check-ins retroactively receive their key
UPDATE user_districts SET has_encounter_key = TRUE WHERE fogged = FALSE;

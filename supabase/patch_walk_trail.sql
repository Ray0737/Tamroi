-- patch_walk_trail.sql
-- Persists the path-based fog reveal (walk trail) per account. Previously the
-- walked points lived only in localStorage (tam_roi_walk_trail_v4), so the
-- revealed trail was lost on another device / cleared browser data.
--
-- Run order: after schema.sql (needs auth.users only).

CREATE TABLE IF NOT EXISTS user_walk_points (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Exact-coordinate PK: each point is recorded once client-side (30 m spacing
  -- rule), so identical lat/lng means the same point re-synced, not new data.
  PRIMARY KEY (user_id, lat, lng)
);

ALTER TABLE user_walk_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read their own walk points"
  ON user_walk_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert their own walk points"
  ON user_walk_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

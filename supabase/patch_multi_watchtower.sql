-- patch_multi_watchtower.sql
-- Adds support for multiple watchtowers per district (e.g. Asok/Wattana having
-- both Satit PSM and Terminal 21 as separate check-in points). Districts with
-- zero rows in `watchtowers` keep the old single-watchtower behavior unchanged
-- (map.js falls back to districts.watchtower_lat/watchtower_lng in that case).
--
-- Run order: after schema.sql + patch_lore.sql (needs districts + user_districts).

-- ── Reference table: one row per physical watchtower ──
CREATE TABLE IF NOT EXISTS watchtowers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id  text NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name_th      text NOT NULL,
  name_en      text,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watchtowers_district ON watchtowers(district_id);

ALTER TABLE watchtowers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watchtowers are publicly readable"
  ON watchtowers FOR SELECT
  USING (true);

-- ── Per-user visit tracking, one row per (user, watchtower) ──
CREATE TABLE IF NOT EXISTS user_watchtower_visits (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watchtower_id  uuid NOT NULL REFERENCES watchtowers(id) ON DELETE CASCADE,
  visited_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, watchtower_id)
);

ALTER TABLE user_watchtower_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read their own watchtower visits"
  ON user_watchtower_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert their own watchtower visits"
  ON user_watchtower_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Completion trigger: once a user has visited every watchtower belonging to
--    a district, mark that district fogged = false for them. Mirrors the
--    threshold-trigger pattern already used for collab missions.
CREATE OR REPLACE FUNCTION check_district_watchtowers_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_district_id  text;
  v_total_count  int;
  v_visited_count int;
BEGIN
  SELECT district_id INTO v_district_id FROM watchtowers WHERE id = NEW.watchtower_id;
  IF v_district_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_total_count
  FROM watchtowers
  WHERE district_id = v_district_id;

  SELECT COUNT(*) INTO v_visited_count
  FROM user_watchtower_visits uwv
  JOIN watchtowers w ON w.id = uwv.watchtower_id
  WHERE uwv.user_id = NEW.user_id AND w.district_id = v_district_id;

  IF v_visited_count >= v_total_count THEN
    INSERT INTO user_districts (user_id, district_id, fogged)
    VALUES (NEW.user_id, v_district_id, false)
    ON CONFLICT (user_id, district_id)
    DO UPDATE SET fogged = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_watchtower_visit_check_district_complete ON user_watchtower_visits;
CREATE TRIGGER on_watchtower_visit_check_district_complete
  AFTER INSERT ON user_watchtower_visits
  FOR EACH ROW EXECUTE FUNCTION check_district_watchtowers_complete();

-- ── Example seed for Asok/Wattana (Satit PSM + Terminal 21) ──
-- Adjust district_id to your actual Wattana/Asok row's id before running.
-- Satit PSM coordinate is search-derived, NOT independently verified against a
-- live map — confirm it lands on the real campus before relying on it.
-- INSERT INTO watchtowers (district_id, name_th, name_en, lat, lng) VALUES
--   ('wattana', 'สาธิต มศว ประสานมิตร', 'Satit PSM', 13.742906, 100.56555),
--   ('wattana', 'เทอร์มินอล 21', 'Terminal 21', 13.7373, 100.5605);

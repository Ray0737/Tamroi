-- ══ Phase 3 Co-op Patch ══════════════════════════════════════════════════════
-- Run after: schema.sql, patch_auth_fix.sql, patch_lore.sql
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── quiz_questions: add raid flag ────────────────────────────────────────────
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS is_raid_question BOOLEAN NOT NULL DEFAULT false;

-- ── figures: add raid columns ────────────────────────────────────────────────
ALTER TABLE figures
  ADD COLUMN IF NOT EXISTS raid_only        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS raid_min_players INT     NOT NULL DEFAULT 2;

-- ── Invite code generator ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_guild_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := upper(substring(md5(gen_random_uuid()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── guilds ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guilds (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    UNIQUE NOT NULL,
  created_by  UUID    REFERENCES auth.users ON DELETE SET NULL,
  invite_code TEXT    UNIQUE NOT NULL DEFAULT '',
  max_members INT     NOT NULL DEFAULT 6,
  created_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_guild_insert_code ON guilds;
CREATE TRIGGER on_guild_insert_code
  BEFORE INSERT ON guilds
  FOR EACH ROW EXECUTE FUNCTION generate_guild_invite_code();

-- ── guild_members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_members (
  guild_id  UUID REFERENCES guilds ON DELETE CASCADE,
  user_id   UUID REFERENCES auth.users ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader','member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);

-- ── collab_missions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collab_missions (
  id                TEXT PRIMARY KEY,
  district_id       TEXT REFERENCES districts,
  title_th          TEXT NOT NULL,
  description_th    TEXT,
  required_players  INT  NOT NULL DEFAULT 3,
  time_window_hours INT  NOT NULL DEFAULT 24,
  reward_lore_id    TEXT REFERENCES lore_nodes,
  reward_pts        INT  NOT NULL DEFAULT 100,
  is_active         BOOLEAN DEFAULT true
);

-- ── collab_mission_checkins ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collab_mission_checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    TEXT REFERENCES collab_missions ON DELETE CASCADE,
  guild_id      UUID REFERENCES guilds ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mission_id, guild_id, user_id)
);

-- ── collab_mission_completions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collab_mission_completions (
  mission_id   TEXT REFERENCES collab_missions ON DELETE CASCADE,
  guild_id     UUID REFERENCES guilds ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mission_id, guild_id)
);

-- ── raid_sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raid_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id           UUID REFERENCES guilds ON DELETE CASCADE,
  figure_id          TEXT REFERENCES figures,
  host_user_id       UUID REFERENCES auth.users ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'waiting'
                       CHECK (status IN ('waiting','active','completed','failed')),
  questions_required INT  NOT NULL DEFAULT 3,
  questions_passed   INT  NOT NULL DEFAULT 0,
  started_at         TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ
);

-- ── raid_session_members ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raid_session_members (
  session_id UUID REFERENCES raid_sessions ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE,
  is_ready   BOOLEAN DEFAULT false,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

-- ── figure_discussions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS figure_discussions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id  TEXT REFERENCES figures ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 500),
  parent_id  UUID REFERENCES figure_discussions ON DELETE CASCADE,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── discussion_flags ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discussion_flags (
  discussion_id UUID REFERENCES figure_discussions ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users ON DELETE CASCADE,
  flagged_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (discussion_id, user_id)
);

-- ── guild_leaderboard VIEW ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW guild_leaderboard AS
SELECT
  g.id   AS guild_id,
  g.name,
  COUNT(DISTINCT ud.district_id) FILTER (WHERE ud.fogged = false)
         AS guild_discovery_count,
  COUNT(DISTINCT uc.figure_id)   AS guild_captures,
  COALESCE(SUM(p.legacy_score), 0) AS guild_legacy_score
FROM guilds g
JOIN guild_members gm ON gm.guild_id = g.id
JOIN profiles      p  ON p.id = gm.user_id
LEFT JOIN user_districts ud ON ud.user_id = gm.user_id
LEFT JOIN user_captures  uc ON uc.user_id = gm.user_id
GROUP BY g.id, g.name;

-- ── RLS policies ──────────────────────────────────────────────────────────────

ALTER TABLE guilds              ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_missions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_mission_checkins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE figure_discussions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_flags     ENABLE ROW LEVEL SECURITY;

-- guilds
DROP POLICY IF EXISTS "guilds_select" ON guilds;
CREATE POLICY "guilds_select" ON guilds FOR SELECT USING (true);

DROP POLICY IF EXISTS "guilds_insert" ON guilds;
CREATE POLICY "guilds_insert" ON guilds FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "guilds_update" ON guilds;
CREATE POLICY "guilds_update" ON guilds FOR UPDATE USING (
  EXISTS (SELECT 1 FROM guild_members WHERE guild_id = id AND user_id = auth.uid() AND role = 'leader')
);

DROP POLICY IF EXISTS "guilds_delete" ON guilds;
CREATE POLICY "guilds_delete" ON guilds FOR DELETE USING (auth.uid() = created_by);

-- guild_members
DROP POLICY IF EXISTS "guild_members_select" ON guild_members;
CREATE POLICY "guild_members_select" ON guild_members FOR SELECT USING (
  guild_id IN (SELECT gm2.guild_id FROM guild_members gm2 WHERE gm2.user_id = auth.uid())
);

DROP POLICY IF EXISTS "guild_members_insert" ON guild_members;
CREATE POLICY "guild_members_insert" ON guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "guild_members_delete" ON guild_members;
CREATE POLICY "guild_members_delete" ON guild_members FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM guild_members gm3 WHERE gm3.guild_id = guild_members.guild_id AND gm3.user_id = auth.uid() AND gm3.role = 'leader')
);

-- collab_missions: public read
DROP POLICY IF EXISTS "collab_missions_select" ON collab_missions;
CREATE POLICY "collab_missions_select" ON collab_missions FOR SELECT USING (true);

-- collab_mission_checkins
DROP POLICY IF EXISTS "collab_checkins_select" ON collab_mission_checkins;
CREATE POLICY "collab_checkins_select" ON collab_mission_checkins FOR SELECT USING (
  guild_id IN (SELECT gm4.guild_id FROM guild_members gm4 WHERE gm4.user_id = auth.uid())
);

DROP POLICY IF EXISTS "collab_checkins_insert" ON collab_mission_checkins;
CREATE POLICY "collab_checkins_insert" ON collab_mission_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- collab_mission_completions
DROP POLICY IF EXISTS "collab_completions_select" ON collab_mission_completions;
CREATE POLICY "collab_completions_select" ON collab_mission_completions FOR SELECT USING (
  guild_id IN (SELECT gm5.guild_id FROM guild_members gm5 WHERE gm5.user_id = auth.uid())
);

-- raid_sessions
DROP POLICY IF EXISTS "raid_sessions_select" ON raid_sessions;
CREATE POLICY "raid_sessions_select" ON raid_sessions FOR SELECT USING (
  guild_id IN (SELECT gm6.guild_id FROM guild_members gm6 WHERE gm6.user_id = auth.uid())
);

DROP POLICY IF EXISTS "raid_sessions_insert" ON raid_sessions;
CREATE POLICY "raid_sessions_insert" ON raid_sessions FOR INSERT WITH CHECK (
  guild_id IN (SELECT gm7.guild_id FROM guild_members gm7 WHERE gm7.user_id = auth.uid())
);

DROP POLICY IF EXISTS "raid_sessions_update" ON raid_sessions;
CREATE POLICY "raid_sessions_update" ON raid_sessions FOR UPDATE USING (
  guild_id IN (SELECT gm8.guild_id FROM guild_members gm8 WHERE gm8.user_id = auth.uid())
);

-- raid_session_members
DROP POLICY IF EXISTS "raid_members_select" ON raid_session_members;
CREATE POLICY "raid_members_select" ON raid_session_members FOR SELECT USING (
  session_id IN (
    SELECT rs.id FROM raid_sessions rs
    WHERE rs.guild_id IN (SELECT gm9.guild_id FROM guild_members gm9 WHERE gm9.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "raid_members_insert" ON raid_session_members;
CREATE POLICY "raid_members_insert" ON raid_session_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "raid_members_update" ON raid_session_members;
CREATE POLICY "raid_members_update" ON raid_session_members FOR UPDATE USING (auth.uid() = user_id);

-- figure_discussions
DROP POLICY IF EXISTS "discussions_select" ON figure_discussions;
CREATE POLICY "discussions_select" ON figure_discussions FOR SELECT USING (NOT is_flagged);

DROP POLICY IF EXISTS "discussions_insert" ON figure_discussions;
CREATE POLICY "discussions_insert" ON figure_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "discussions_delete" ON figure_discussions;
CREATE POLICY "discussions_delete" ON figure_discussions FOR DELETE USING (auth.uid() = user_id);

-- discussion_flags
DROP POLICY IF EXISTS "flags_insert" ON discussion_flags;
CREATE POLICY "flags_insert" ON discussion_flags FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Trigger: collab checkin threshold ────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_collab_mission_threshold()
RETURNS TRIGGER AS $$
DECLARE
  m            RECORD;
  checkin_cnt  INT;
  already_done BOOLEAN;
  p            RECORD;
BEGIN
  SELECT required_players, time_window_hours, reward_pts, reward_lore_id
    INTO m FROM collab_missions WHERE id = NEW.mission_id;

  SELECT COUNT(*) INTO checkin_cnt
    FROM collab_mission_checkins
   WHERE mission_id = NEW.mission_id
     AND guild_id   = NEW.guild_id
     AND checked_in_at >= NOW() - (m.time_window_hours || ' hours')::INTERVAL;

  SELECT EXISTS(
    SELECT 1 FROM collab_mission_completions
     WHERE mission_id = NEW.mission_id AND guild_id = NEW.guild_id
  ) INTO already_done;

  IF checkin_cnt >= m.required_players AND NOT already_done THEN
    INSERT INTO collab_mission_completions (mission_id, guild_id)
    VALUES (NEW.mission_id, NEW.guild_id)
    ON CONFLICT DO NOTHING;

    FOR p IN
      SELECT DISTINCT user_id FROM collab_mission_checkins
       WHERE mission_id = NEW.mission_id AND guild_id = NEW.guild_id
    LOOP
      IF m.reward_lore_id IS NOT NULL THEN
        INSERT INTO user_lore (user_id, lore_node_id)
        VALUES (p.user_id, m.reward_lore_id)
        ON CONFLICT (user_id, lore_node_id) DO NOTHING;
      END IF;

      UPDATE profiles
         SET legacy_score = COALESCE(legacy_score, 0) + m.reward_pts
       WHERE id = p.user_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collab_checkin_threshold ON collab_mission_checkins;
CREATE TRIGGER on_collab_checkin_threshold
  AFTER INSERT ON collab_mission_checkins
  FOR EACH ROW EXECUTE FUNCTION check_collab_mission_threshold();

-- ── Trigger: discussion flag count ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_discussion_flag_count()
RETURNS TRIGGER AS $$
DECLARE
  flag_cnt INT;
BEGIN
  SELECT COUNT(*) INTO flag_cnt
    FROM discussion_flags WHERE discussion_id = NEW.discussion_id;

  IF flag_cnt >= 3 THEN
    UPDATE figure_discussions SET is_flagged = true WHERE id = NEW.discussion_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_discussion_flag_count ON discussion_flags;
CREATE TRIGGER on_discussion_flag_count
  AFTER INSERT ON discussion_flags
  FOR EACH ROW EXECUTE FUNCTION check_discussion_flag_count();

-- ── Seed collab missions ──────────────────────────────────────────────────────
INSERT INTO collab_missions (id, district_id, title_th, description_th, required_players, time_window_hours, reward_pts, is_active)
VALUES
  ('collab_rattanakosin_1', 'rattanakosin',
   'อนุสรณ์ประชาธิปไตย',
   'นำสมาชิกกลุ่ม 3 คน Check-in ย่านรัตนโกสินทร์ภายใน 24 ชั่วโมง เพื่อปลดล็อก Lore พิเศษของเหตุการณ์ 14 ตุลา 2516',
   3, 24, 100, true),
  ('collab_ayutthaya_1', 'ayutthaya',
   'พิชิตพระนครศรีอยุธยา',
   'สมาชิกกลุ่ม 2 คน สำรวจเขตอยุธยาพร้อมกันภายใน 48 ชั่วโมง',
   2, 48, 150, true)
ON CONFLICT (id) DO NOTHING;

-- ── Mark sample S-tier figures as raid-only ───────────────────────────────────
-- Flags the first 2 S-class figures as raid-only for MVP testing.
-- Adjust IDs manually to target specific figures in production.
UPDATE figures
   SET raid_only = true, raid_min_players = 2
 WHERE class = 'S'
   AND id IN (
     SELECT id FROM figures WHERE class = 'S' AND is_active = true ORDER BY created_at LIMIT 2
   );

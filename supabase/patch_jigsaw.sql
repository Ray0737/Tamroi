-- ══ Jigsaw Learning Patch ════════════════════════════════════════════════════
-- Run after: patch_coop.sql
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── lore_nodes: chapter support ──────────────────────────────────────────────
-- chapter_index NULL = standalone lore; 0,1,2 = jigsaw chapter
ALTER TABLE lore_nodes ADD COLUMN IF NOT EXISTS chapter_index INT;

-- ── collab_missions: add type column ─────────────────────────────────────────
ALTER TABLE collab_missions ADD COLUMN IF NOT EXISTS
  type TEXT NOT NULL DEFAULT 'checkin' CHECK (type IN ('checkin', 'jigsaw'));

-- ── guild_jigsaw_assignments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_jigsaw_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id        UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  mission_id      TEXT NOT NULL REFERENCES collab_missions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_index   INT  NOT NULL,
  chapter_summary TEXT CHECK (char_length(chapter_summary) <= 600),
  summary_posted  BOOLEAN NOT NULL DEFAULT false,
  assigned_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (guild_id, mission_id, user_id)
);

ALTER TABLE guild_jigsaw_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jigsaw_select" ON guild_jigsaw_assignments;
CREATE POLICY "jigsaw_select" ON guild_jigsaw_assignments FOR SELECT USING (
  guild_id IN (SELECT gm.guild_id FROM guild_members gm WHERE gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "jigsaw_insert" ON guild_jigsaw_assignments;
CREATE POLICY "jigsaw_insert" ON guild_jigsaw_assignments FOR INSERT WITH CHECK (
  guild_id IN (SELECT gm.guild_id FROM guild_members gm WHERE gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "jigsaw_update_own" ON guild_jigsaw_assignments;
CREATE POLICY "jigsaw_update_own" ON guild_jigsaw_assignments
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Tag existing rattanakosin chain lore nodes as jigsaw chapters ─────────────
UPDATE lore_nodes SET chapter_index = 0 WHERE id = 'lore-rattanakosin-wall';
UPDATE lore_nodes SET chapter_index = 1 WHERE id = 'lore-grand-palace-axis';
UPDATE lore_nodes SET chapter_index = 2 WHERE id = 'lore-wat-pho-learning';

-- ── Seed a jigsaw collab mission ──────────────────────────────────────────────
INSERT INTO collab_missions
  (id, district_id, title_th, description_th, required_players, time_window_hours, reward_pts, is_active, type)
VALUES
  ('jigsaw_rattanakosin_1', 'rattanakosin',
   'ปริศนารัตนโกสินทร์ (Jigsaw)',
   'สมาชิกแต่ละคนได้รับบทที่ต่างกันเกี่ยวกับการก่อตั้งกรุงรัตนโกสินทร์ อ่านและแบ่งปันสาระสำคัญให้กิลด์ เมื่อทุกบทเสร็จสิ้น — ภาพรวมสมบูรณ์จะปรากฏขึ้น',
   3, 72, 200, true, 'jigsaw')
ON CONFLICT (id) DO NOTHING;

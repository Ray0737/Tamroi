-- ══ Jigsaw v2 Patch — GPS Checkpoint + Timeline Reconstruction ═══════════════
-- Run after: patch_jigsaw.sql, patch_retrieval_practice.sql
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- 1. Link each assignment to its GPS lore node
ALTER TABLE guild_jigsaw_assignments
  ADD COLUMN IF NOT EXISTS lore_node_id TEXT REFERENCES lore_nodes(id),
  ADD COLUMN IF NOT EXISTS proposed_order JSONB;

-- 2. Optional legendary unlock per jigsaw mission
ALTER TABLE collab_missions
  ADD COLUMN IF NOT EXISTS unlocks_figure_id TEXT REFERENCES figures(id);

-- 3. Per-user legendary unlock grants from jigsaw completion
CREATE TABLE IF NOT EXISTS user_jigsaw_encounters (
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  figure_id   TEXT REFERENCES figures(id)  ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, figure_id)
);

ALTER TABLE user_jigsaw_encounters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own jigsaw encounters" ON user_jigsaw_encounters;
CREATE POLICY "own jigsaw encounters" ON user_jigsaw_encounters
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Backfill lore_node_id for existing rattanakosin seed mission
UPDATE guild_jigsaw_assignments gja
SET lore_node_id = ln.id
FROM lore_nodes ln
WHERE ln.chapter_index = gja.chapter_index
  AND gja.mission_id = 'jigsaw_rattanakosin_1';

-- 5. Merge-agreement trigger — fires off each member's own proposed_order UPDATE
-- (RLS already allows a member to update their own assignment row via
-- jigsaw_update_own; there is no INSERT policy on collab_mission_completions,
-- so the client can never write that table directly — only this SECURITY
-- DEFINER trigger can). Once every row in a (guild, mission) has a non-null
-- proposed_order and they all match each other AND match the ground-truth
-- chapter_index order, this awards reward_pts + any legendary encounter to
-- every participant who posted a summary. Wrong-but-unanimous votes are a
-- silent no-op — the client just re-shows the mismatch and lets them retry.
CREATE OR REPLACE FUNCTION check_jigsaw_merge_agreement()
RETURNS TRIGGER AS $$
DECLARE
  m               collab_missions%ROWTYPE;
  total_cnt       INT;
  agreed_cnt      INT;
  distinct_orders INT;
  first_order     JSONB;
  correct_order   JSONB;
  already_done    BOOLEAN;
  p               RECORD;
BEGIN
  SELECT * INTO m FROM collab_missions WHERE id = NEW.mission_id;
  IF NOT FOUND OR m.type IS DISTINCT FROM 'jigsaw' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*), COUNT(proposed_order), COUNT(DISTINCT proposed_order)
    INTO total_cnt, agreed_cnt, distinct_orders
    FROM guild_jigsaw_assignments
   WHERE mission_id = NEW.mission_id AND guild_id = NEW.guild_id;

  IF total_cnt = 0 OR agreed_cnt < total_cnt OR distinct_orders <> 1 THEN
    RETURN NEW; -- someone hasn't voted yet, or votes disagree
  END IF;

  SELECT proposed_order INTO first_order
    FROM guild_jigsaw_assignments
   WHERE mission_id = NEW.mission_id AND guild_id = NEW.guild_id
   LIMIT 1;

  SELECT jsonb_agg(chapter_index ORDER BY chapter_index) INTO correct_order
    FROM (SELECT DISTINCT chapter_index FROM guild_jigsaw_assignments
           WHERE mission_id = NEW.mission_id AND guild_id = NEW.guild_id) t;

  IF first_order IS DISTINCT FROM correct_order THEN
    RETURN NEW; -- unanimous but wrong — no reward, client shows retry
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM collab_mission_completions
     WHERE mission_id = NEW.mission_id AND guild_id = NEW.guild_id
  ) INTO already_done;
  IF already_done THEN
    RETURN NEW; -- already rewarded (e.g. two members' updates both fired this trigger)
  END IF;

  INSERT INTO collab_mission_completions (mission_id, guild_id)
  VALUES (NEW.mission_id, NEW.guild_id)
  ON CONFLICT DO NOTHING;

  FOR p IN
    SELECT user_id FROM guild_jigsaw_assignments
     WHERE mission_id = NEW.mission_id AND guild_id = NEW.guild_id AND summary_posted = true
  LOOP
    UPDATE profiles SET legacy_score = COALESCE(legacy_score, 0) + m.reward_pts WHERE id = p.user_id;

    IF m.unlocks_figure_id IS NOT NULL THEN
      INSERT INTO user_jigsaw_encounters (user_id, figure_id)
      VALUES (p.user_id, m.unlocks_figure_id)
      ON CONFLICT (user_id, figure_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_jigsaw_proposed_order ON guild_jigsaw_assignments;
CREATE TRIGGER on_jigsaw_proposed_order
  AFTER UPDATE OF proposed_order ON guild_jigsaw_assignments
  FOR EACH ROW WHEN (NEW.proposed_order IS NOT NULL)
  EXECUTE FUNCTION check_jigsaw_merge_agreement();

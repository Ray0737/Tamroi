-- ══ Retrieval Practice Patch ══════════════════════════════════════════════════
-- Run after: patch_lore.sql, patch_daily_challenges.sql
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── quiz_questions: ensure lore_id + assessment_type columns exist ────────────
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS lore_id TEXT REFERENCES lore_nodes(id);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS assessment_type TEXT NOT NULL DEFAULT 'capture';

ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_assessment_type_check;
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_assessment_type_check
  CHECK (assessment_type IN ('capture', 'pretest', 'recall'));

-- ── user_lore: add recall_due_at ──────────────────────────────────────────────
ALTER TABLE user_lore ADD COLUMN IF NOT EXISTS recall_due_at TIMESTAMPTZ;

-- ── Trigger: set recall_due_at on new unlock ──────────────────────────────────
CREATE OR REPLACE FUNCTION set_recall_due_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.recall_due_at := COALESCE(NEW.unlocked_at, NOW()) + INTERVAL '3 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_lore_unlock_set_recall ON user_lore;
CREATE TRIGGER on_lore_unlock_set_recall
  BEFORE INSERT ON user_lore
  FOR EACH ROW EXECUTE FUNCTION set_recall_due_at();

-- Backfill existing rows
UPDATE user_lore
   SET recall_due_at = unlocked_at + INTERVAL '3 days'
 WHERE recall_due_at IS NULL;

-- ── daily_challenges: add lore_recall type + lore_node_id column ──────────────
ALTER TABLE daily_challenges DROP CONSTRAINT IF EXISTS daily_challenges_type_check;
ALTER TABLE daily_challenges ADD CONSTRAINT daily_challenges_type_check
  CHECK (type IN ('lore', 'checkin', 'capture', 'quiz', 'lore_recall'));

ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS lore_node_id TEXT REFERENCES lore_nodes(id);

-- ── Seed two recall questions for existing lore nodes ─────────────────────────
INSERT INTO quiz_questions
  (figure_id, district_id, question_th, option_a, option_b, option_c, option_d,
   correct_option, difficulty, lore_id, assessment_type)
VALUES
  (NULL, 'rattanakosin',
   'กำแพงเมืองและคูคลองในเกาะรัตนโกสินทร์มีบทบาทหลักอะไรในยุคแรก',
   'ป้องกันเมืองและกำหนดขอบเขตอำนาจ', 'เส้นทางคมนาคมหลัก',
   'แหล่งน้ำดื่มสาธารณะ', 'แนวระบายน้ำ',
   'A', 'C', 'lore-rattanakosin-wall', 'recall'),
  (NULL, 'rattanakosin',
   'วัดโพธิ์เปรียบได้กับสิ่งใดในอดีต ตามเนื้อหาที่คุณอ่าน',
   'มหาวิทยาลัยกลางเมือง', 'ตลาดการค้าหลัก',
   'พระราชวังสำรอง', 'ป้อมปราการ',
   'A', 'C', 'lore-wat-pho-learning', 'recall')
ON CONFLICT DO NOTHING;

-- patch_daily_challenges.sql — daily challenge tables for NSC demo
-- Run in Supabase SQL Editor after schema.sql + patch_lore.sql

CREATE TABLE IF NOT EXISTS daily_challenges (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title_th     TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('lore','checkin','capture','quiz')),
  target_count INT  NOT NULL DEFAULT 1,
  pts_reward   INT  NOT NULL DEFAULT 50,
  is_active    BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_daily_progress (
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id  TEXT REFERENCES daily_challenges(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  current_count INT  DEFAULT 0,
  completed     BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, challenge_id, date)
);

ALTER TABLE user_daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Own daily progress" ON user_daily_progress
  FOR ALL USING (auth.uid() = user_id);

INSERT INTO daily_challenges (id, title_th, type, target_count, pts_reward) VALUES
  ('dc-lore',    'ปลดล็อคเรื่องราวเชิงลึก 1 จุด',       'lore',    1, 50),
  ('dc-checkin', 'เช็คอินจุดสังเกตการณ์ใหม่',             'checkin', 1, 75),
  ('dc-capture', 'จับบุคคลสำคัญระดับ B ขึ้นไป',            'capture', 1, 100),
  ('dc-quiz',    'ตอบแบบทดสอบถูกต้องครบ 3 ข้อ',            'quiz',    3, 30)
ON CONFLICT (id) DO NOTHING;

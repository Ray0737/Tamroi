-- ══ Unsolved History (Debate) Patch ══════════════════════════════════════════
-- Run after: patch_lore.sql (figures table must exist)
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── history_debates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS history_debates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id        TEXT REFERENCES figures(id) ON DELETE CASCADE,
  title_th         TEXT NOT NULL,
  case_a_title     TEXT NOT NULL DEFAULT 'กรณี A',
  case_a_text      TEXT NOT NULL,
  case_b_title     TEXT NOT NULL DEFAULT 'กรณี B',
  case_b_text      TEXT NOT NULL,
  source_citations TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE history_debates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debates_select" ON history_debates;
CREATE POLICY "debates_select" ON history_debates FOR SELECT USING (is_active = true);

-- ── debate_votes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debate_votes (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id  UUID    NOT NULL REFERENCES history_debates(id) ON DELETE CASCADE,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote       CHAR(1) NOT NULL CHECK (vote IN ('A','B')),
  reason     TEXT    CHECK (char_length(reason) <= 200),
  voted_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (debate_id, user_id)
);

ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own vote; aggregate counts come via RPC.
DROP POLICY IF EXISTS "debate_votes_own" ON debate_votes;
CREATE POLICY "debate_votes_own" ON debate_votes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── get_debate_stats RPC ──────────────────────────────────────────────────────
-- Returns aggregate counts + caller's own vote. SECURITY DEFINER bypasses RLS
-- so callers see totals without seeing who voted what.
CREATE OR REPLACE FUNCTION get_debate_stats(p_debate_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'count_a',   COUNT(*) FILTER (WHERE vote = 'A'),
    'count_b',   COUNT(*) FILTER (WHERE vote = 'B'),
    'total',     COUNT(*),
    'user_vote', MAX(vote) FILTER (WHERE user_id = auth.uid()),
    'reasons_a', COALESCE(
      (SELECT json_agg(r.reason)
       FROM (SELECT reason FROM debate_votes
             WHERE debate_id = p_debate_id AND vote = 'A'
               AND reason IS NOT NULL ORDER BY voted_at DESC LIMIT 3) r),
      '[]'::json),
    'reasons_b', COALESCE(
      (SELECT json_agg(r.reason)
       FROM (SELECT reason FROM debate_votes
             WHERE debate_id = p_debate_id AND vote = 'B'
               AND reason IS NOT NULL ORDER BY voted_at DESC LIMIT 3) r),
      '[]'::json)
  ) INTO result
  FROM debate_votes
  WHERE debate_id = p_debate_id;
  RETURN COALESCE(result, json_build_object(
    'count_a',0,'count_b',0,'total',0,'user_vote',NULL,'reasons_a','[]'::json,'reasons_b','[]'::json
  ));
END;
$$;

-- ── Seed two example debates ──────────────────────────────────────────────────
INSERT INTO history_debates (id, figure_id, title_th, case_a_title, case_a_text, case_b_title, case_b_text, source_citations)
VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'king-taksin',
    'การดวลยุทธช้างของพระนเรศวร — ประวัติศาสตร์หรือตำนาน?',
    'มีหลักฐานทางประวัติศาสตร์',
    'พงศาวดารไทยหลายฉบับบันทึกเหตุการณ์ยุทธหัตถีอย่างสอดคล้องกัน และมีหลักฐานร่วมสมัยจากฝั่งพม่าที่อ้างถึงการสูญเสียรัชทายาทในสงครามกับสยาม นักประวัติศาสตร์บางคนมองว่าเหตุการณ์นี้เกิดขึ้นจริงในรูปแบบใดรูปแบบหนึ่ง แม้รายละเอียดจะถูกเสริมแต่งในภายหลัง',
    'เป็นตำนานที่สร้างขึ้นภายหลัง',
    'นักวิชาการสมัยใหม่ชี้ว่าการดวลช้างแบบตัวต่อตัวระหว่างกษัตริย์เป็นเรื่องผิดปกติทางยุทธวิธี และรูปแบบที่บันทึกไว้มีลักษณะใกล้เคียงกับวรรณคดีมากกว่าบันทึกทางทหาร พงศาวดารพม่ากล่าวถึงการสูญเสียรัชทายาทแต่ไม่ได้ยืนยันการดวลช้างโดยตรง',
    'พงศาวดารกรุงศรีอยุธยา ฉบับหลวงประเสริฐ; Lieberman, V. (2003). Strange Parallels.'
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'si-suriyothai',
    'การล่มสลายของอยุธยา — ความขัดแย้งภายในหรือแสนยานุภาพพม่า?',
    'ความขัดแย้งภายในเป็นสาเหตุหลัก',
    'นักประวัติศาสตร์หลายคนชี้ว่าการแย่งชิงอำนาจภายในราชสำนักอยุธยาและการทุจริตของขุนนางทำให้กองทัพอ่อนแอลงก่อนพม่าจะบุกโจมตี การแตกแยกของชนชั้นนำทำให้ไม่สามารถระดมกำลังป้องกันเมืองได้อย่างมีประสิทธิภาพ',
    'แสนยานุภาพพม่าเป็นปัจจัยชี้ขาด',
    'กองทัพพม่าสมัยอลองพญาและมังระมีการจัดระเบียบและอาวุธยุทโธปกรณ์ที่เหนือกว่าชัดเจน การล้อมเมืองนาน 14 เดือนแสดงถึงศักยภาพทางทหารขั้นสูง และอยุธยาก็ต้านทานได้นานกว่าที่ทฤษฎีความอ่อนแอภายในจะอธิบายได้',
    'Baker, C. & Phongpaichit, P. (2009). A History of Thailand; Wyatt, D. (2003). Thailand: A Short History.'
  )
ON CONFLICT (id) DO NOTHING;

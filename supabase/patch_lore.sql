-- ============================================================
-- Tamroi Lore + Quiz + Score Patch
-- Run after supabase/schema.sql and supabase/patch_auth_fix.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS lore_nodes (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name_th      TEXT NOT NULL,
  name_en      TEXT,
  lat          NUMERIC(10,7) NOT NULL,
  lng          NUMERIC(10,7) NOT NULL,
  radius_m     INTEGER DEFAULT 100,
  lore_pts     INTEGER DEFAULT 20,
  content_type TEXT DEFAULT 'text',
  content_th   TEXT,
  content_en   TEXT,
  media_url    TEXT,
  chain_id     TEXT,
  chain_part   INTEGER,
  district_id  TEXT REFERENCES districts(id),
  is_active    BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_lore (
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lore_id     TEXT REFERENCES lore_nodes(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, lore_id)
);

ALTER TABLE lore_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lore  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read lore" ON lore_nodes;
CREATE POLICY "public read lore" ON lore_nodes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "own lore" ON user_lore;
CREATE POLICY "own lore" ON user_lore FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION increment_legacy_score(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET legacy_score = COALESCE(legacy_score, 0) + COALESCE(p_amount, 0),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_node_visit(p_user_id UUID, p_district_id TEXT, p_node_type TEXT)
RETURNS user_districts AS $$
DECLARE
  updated_row user_districts;
BEGIN
  INSERT INTO user_districts (user_id, district_id)
  VALUES (p_user_id, p_district_id)
  ON CONFLICT (user_id, district_id) DO NOTHING;

  UPDATE user_districts
  SET cafes_visited = CASE WHEN p_node_type = 'cafe' THEN COALESCE(cafes_visited, 0) + 1 ELSE cafes_visited END,
      otops_visited = CASE WHEN p_node_type = 'otop' THEN COALESCE(otops_visited, 0) + 1 ELSE otops_visited END,
      landmarks_visited = CASE WHEN p_node_type = 'landmark' THEN COALESCE(landmarks_visited, 0) + 1 ELSE landmarks_visited END
  WHERE user_id = p_user_id
    AND district_id = p_district_id
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_legacy_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET legacy_score = COALESCE(legacy_score, 0) + COALESCE((
        SELECT legacy_pts FROM figures WHERE id = NEW.figure_id
      ), 0),
      archive_count = COALESCE(archive_count, 0) + 1,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_capture_update_score ON user_captures;
CREATE TRIGGER on_capture_update_score
AFTER INSERT ON user_captures
FOR EACH ROW EXECUTE FUNCTION update_legacy_score();

CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id      TEXT REFERENCES figures(id),
  district_id    TEXT REFERENCES districts(id),
  question_th    TEXT NOT NULL,
  option_a       TEXT,
  option_b       TEXT,
  option_c       TEXT,
  option_d       TEXT,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  difficulty     TEXT DEFAULT 'C'
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read quiz" ON quiz_questions;
CREATE POLICY "public read quiz" ON quiz_questions FOR SELECT USING (true);

INSERT INTO lore_nodes (id, name_th, name_en, lat, lng, radius_m, lore_pts, content_type, content_th, content_en, chain_id, chain_part, district_id)
VALUES
('lore-rattanakosin-wall', 'ร่องรอยกำแพงเมือง', 'Old City Wall Trace', 13.7530, 100.4970, 120, 30, 'text',
 'บริเวณเกาะรัตนโกสินทร์เคยเป็นศูนย์กลางการป้องกันเมือง มีคูคลองและกำแพงเมืองช่วยกำหนดขอบเขตอำนาจของกรุงเทพฯ ยุคแรก',
 'Rattanakosin once relied on canals and walls to define and defend the early capital.', 'chain-rattanakosin-founding', 1, 'rattanakosin'),
('lore-grand-palace-axis', 'แกนพระบรมมหาราชวัง', 'Grand Palace Axis', 13.7510, 100.4925, 120, 30, 'text',
 'พระบรมมหาราชวังไม่ได้เป็นเพียงที่ประทับ แต่เป็นสัญลักษณ์ของการตั้งราชธานีใหม่และการจัดระเบียบพื้นที่ศักดิ์สิทธิ์ของเมือง',
 'The Grand Palace marked both royal residence and the sacred order of the new capital.', 'chain-rattanakosin-founding', 2, 'rattanakosin'),
('lore-wat-pho-learning', 'วัดโพธิ์กับความรู้สาธารณะ', 'Wat Pho Public Knowledge', 13.7465, 100.4930, 120, 40, 'text',
 'วัดโพธิ์เป็นแหล่งรวบรวมตำรา ความรู้แพทย์แผนไทย และจารึกที่เปิดให้ผู้คนเรียนรู้ จึงเปรียบเสมือนมหาวิทยาลัยกลางเมืองในอดีต',
 'Wat Pho preserved inscriptions and traditional knowledge for public learning.', 'chain-rattanakosin-founding', 3, 'rattanakosin'),
('lore-silom-trade', 'เส้นทางการค้าสีลม', 'Silom Trade Route', 13.7260, 100.5310, 100, 25, 'text',
 'ย่านสีลมเติบโตจากเส้นทางคมนาคมและการค้า เชื่อมชุมชนริมเจ้าพระยากับเศรษฐกิจเมืองสมัยใหม่',
 'Silom grew from transport and trade routes linking river communities with the modern city.', NULL, NULL, 'silom'),
('lore-chatuchak-market', 'ตลาดนัดกับเมืองร่วมสมัย', 'Weekend Market Memory', 13.7990, 100.5510, 100, 25, 'text',
 'จตุจักรสะท้อนเศรษฐกิจสร้างสรรค์ของกรุงเทพฯ ที่รวมงานฝีมือ อาหาร และความทรงจำของคนเมืองไว้ในพื้นที่เดียว',
 'Chatuchak reflects Bangkok creative commerce through crafts, food, and urban memory.', NULL, NULL, 'chatuchak')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_questions (figure_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty)
VALUES
('king-taksin', 'rattanakosin', 'สมเด็จพระเจ้าตากสินมีบทบาทสำคัญเรื่องใด', 'กอบกู้เอกราชหลังเสียกรุงศรีอยุธยา', 'สร้างทางรถไฟสายแรก', 'ก่อตั้งตลาดนัดจตุจักร', 'ประดิษฐ์อักษรไทย', 'A', 'S'),
('king-taksin', 'rattanakosin', 'เมืองหลวงที่เกี่ยวข้องกับพระเจ้าตากสินคือข้อใด', 'ธนบุรี', 'เชียงใหม่', 'ภูเก็ต', 'นครราชสีมา', 'A', 'S'),
('rama-i', 'rattanakosin', 'พระบาทสมเด็จพระพุทธยอดฟ้าฯ ทรงเกี่ยวข้องกับเหตุการณ์ใด', 'สถาปนากรุงรัตนโกสินทร์', 'สร้างรถไฟฟ้าสายสีลม', 'ตั้งมหาวิทยาลัยธรรมศาสตร์', 'เปิดสนามบินสุวรรณภูมิ', 'A', 'S'),
('rama-i', 'rattanakosin', 'ราชวงศ์ที่เริ่มต้นในสมัยรัชกาลที่ 1 คือข้อใด', 'จักรี', 'สุพรรณภูมิ', 'ล้านนา', 'ศรีวิชัย', 'A', 'S'),
('sunthon-phu', 'rattanakosin', 'สุนทรภู่เป็นที่รู้จักในฐานะใด', 'กวีเอก', 'แม่ทัพเรือ', 'ช่างทอง', 'นักดาราศาสตร์', 'A', 'A'),
('sunthon-phu', 'rattanakosin', 'ผลงานวรรณคดีที่เกี่ยวข้องกับสุนทรภู่คือข้อใด', 'พระอภัยมณี', 'ไตรภูมิพระร่วง', 'ลิลิตตะเลงพ่าย', 'รามเกียรติ์ฉบับรัชกาลที่ 1', 'A', 'A'),
('si-suriyothai', 'rattanakosin', 'สมเด็จพระศรีสุริโยทัยเป็นสัญลักษณ์ของคุณค่าใด', 'ความเสียสละ', 'การค้าทางทะเล', 'การประดิษฐ์เครื่องปั้น', 'การสำรวจอวกาศ', 'A', 'A'),
('si-suriyothai', 'rattanakosin', 'เรื่องเล่าของพระศรีสุริโยทัยเกี่ยวข้องกับพื้นที่ประวัติศาสตร์ใด', 'อยุธยา', 'สีลม', 'จตุจักร', 'บางนา', 'A', 'A'),
('village-elder', 'silom', 'ขุนนางท้องถิ่นในเกมสะท้อนบทบาทใดของชุมชน', 'การนำและดูแลชุมชน', 'การขับรถไฟฟ้า', 'การผลิตดาวเทียม', 'การสร้างห้างสรรพสินค้า', 'A', 'C'),
('village-elder', 'silom', 'ชุมชนริมแม่น้ำเจ้าพระยามีความสำคัญต่อเมืองอย่างไร', 'การค้าและคมนาคม', 'สนามบินนานาชาติ', 'เหมืองแร่', 'ไร่ชา', 'A', 'C'),
('otop-master', 'chatuchak', 'OTOP ในเกมเน้นคุณค่าใด', 'งานฝีมือท้องถิ่น', 'การแข่งรถ', 'อวกาศ', 'อุตสาหกรรมน้ำมัน', 'A', 'C'),
('otop-master', 'chatuchak', 'ช่างฝีมือ OTOP ช่วยสืบทอดสิ่งใด', 'ภูมิปัญญาและศิลปะไทย', 'แผนที่ดาวอังคาร', 'หุ้นต่างประเทศ', 'กีฬาโอลิมปิก', 'A', 'C'),
('river-merchant', 'silom', 'พ่อค้าแม่น้ำเกี่ยวข้องกับระบบใดมากที่สุด', 'การค้าทางน้ำ', 'รถไฟใต้ดิน', 'อุตสาหกรรมอวกาศ', 'ฟุตบอลอาชีพ', 'A', 'C'),
('river-merchant', 'silom', 'แม่น้ำเจ้าพระยามีบทบาทต่อกรุงเทพฯ อย่างไร', 'เป็นเส้นทางเศรษฐกิจและคมนาคม', 'เป็นภูเขาไฟ', 'เป็นทะเลทราย', 'เป็นเหมืองทองคำ', 'A', 'C')
ON CONFLICT DO NOTHING;

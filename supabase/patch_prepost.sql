-- patch_prepost.sql
-- Pre/post lore assessment schema + seed data
-- Run after patch_notification_ref.sql
-- Fully idempotent: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / ON CONFLICT DO NOTHING

-- -----------------------------------------------------------------------
-- 1. Extend quiz_questions
-- -----------------------------------------------------------------------

ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS lore_id TEXT REFERENCES lore_nodes(id),
  ADD COLUMN IF NOT EXISTS assessment_type TEXT
    CHECK (assessment_type IN ('pretest','posttest','capture'))
    DEFAULT 'capture';

-- Unique constraint so seed inserts are idempotent on re-run
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_questions_lore_question_key'
      AND conrelid = 'quiz_questions'::regclass
  ) THEN
    ALTER TABLE quiz_questions
      ADD CONSTRAINT quiz_questions_lore_question_key UNIQUE (lore_id, question_th);
  END IF;
END $$;

-- -----------------------------------------------------------------------
-- 2. user_lore_assessments table
-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_lore_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lore_id     TEXT REFERENCES lore_nodes(id) ON DELETE CASCADE,
  phase       TEXT NOT NULL CHECK (phase IN ('pre','post')),
  score       SMALLINT NOT NULL,
  total       SMALLINT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, lore_id, phase)
);

ALTER TABLE user_lore_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own assessments" ON user_lore_assessments;
CREATE POLICY "own assessments" ON user_lore_assessments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------
-- 3. Seed pretest questions (4 per lore node, Thai language, figure_id NULL)
-- -----------------------------------------------------------------------

INSERT INTO quiz_questions
  (figure_id, district_id, lore_id, assessment_type, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty)
VALUES

-- lore-rattanakosin-wall (district: rattanakosin)
(NULL, 'rattanakosin', 'lore-rattanakosin-wall', 'pretest',
 'สิ่งใดช่วยกำหนดขอบเขตและป้องกันกรุงเทพฯ ในยุคแรก',
 'คูคลองและกำแพงเมือง', 'ทางรถไฟสายแรก', 'สะพานข้ามทะเล', 'กำแพงไม้ไผ่ขนาดใหญ่',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-rattanakosin-wall', 'pretest',
 'กำแพงเมืองในยุคแรกของกรุงเทพฯ มีบทบาทหลักอย่างไร',
 'ป้องกันข้าศึกและกำหนดอาณาเขต', 'ใช้เป็นสถานที่ค้าขาย', 'ใช้เป็นสถานที่ประกอบพิธีทางศาสนา', 'ใช้เป็นที่พักอาศัยของพลเมือง',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-rattanakosin-wall', 'pretest',
 'คูคลองในกรุงรัตนโกสินทร์ยุคแรกมีความสำคัญอย่างไร',
 'ช่วยในการป้องกันเมืองและคมนาคม', 'ใช้สำหรับเพาะปลูกข้าวเท่านั้น', 'เป็นเพียงสิ่งประดับตกแต่ง', 'ใช้สำหรับแข่งเรือเป็นหลัก',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-rattanakosin-wall', 'pretest',
 'กรุงเทพฯ ยุคแรกสร้างบนพื้นที่ใด',
 'ที่ราบลุ่มแม่น้ำเจ้าพระยา', 'ยอดเขาสูง', 'ชายฝั่งทะเลอันดามัน', 'ป่าทึบทางภาคเหนือ',
 'A', 'C'),

-- lore-grand-palace-axis (district: rattanakosin)
(NULL, 'rattanakosin', 'lore-grand-palace-axis', 'pretest',
 'พระบรมมหาราชวังสร้างขึ้นเพื่อวัตถุประสงค์ใดนอกจากเป็นที่ประทับของพระมหากษัตริย์',
 'เป็นสัญลักษณ์ของราชธานีใหม่และพื้นที่ศักดิ์สิทธิ์', 'เป็นตลาดค้าขายระหว่างประเทศ', 'เป็นสนามรบหลักของกรุงเทพฯ', 'เป็นสถานที่เก็บสะสมอาวุธ',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-grand-palace-axis', 'pretest',
 'การสร้างพระบรมมหาราชวังสะท้อนถึงสิ่งใด',
 'การตั้งราชธานีใหม่แห่งกรุงรัตนโกสินทร์', 'การสิ้นสุดของอาณาจักรอยุธยา', 'การค้าขายกับประเทศจีน', 'การสร้างทางรถไฟสายแรก',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-grand-palace-axis', 'pretest',
 'พื้นที่ศักดิ์สิทธิ์รอบพระบรมมหาราชวังหมายถึงอะไร',
 'พื้นที่ที่มีความสำคัญทางศาสนาและพิธีกรรมของราชสำนัก', 'พื้นที่สำหรับการเพาะปลูกข้าว', 'พื้นที่ตลาดสดประจำวัน', 'พื้นที่สำหรับฝึกซ้อมทหาร',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-grand-palace-axis', 'pretest',
 'ราชธานีใหม่ที่มีพระบรมมหาราชวังเป็นศูนย์กลางหมายถึงเมืองใด',
 'กรุงรัตนโกสินทร์ (กรุงเทพมหานคร)', 'พระนครศรีอยุธยา', 'เชียงใหม่', 'ธนบุรี',
 'A', 'C'),

-- lore-wat-pho-learning (district: rattanakosin)
(NULL, 'rattanakosin', 'lore-wat-pho-learning', 'pretest',
 'วัดโพธิ์มีบทบาทสำคัญใดในด้านการเรียนรู้',
 'เป็นแหล่งรวมความรู้แพทย์แผนไทยและจารึกความรู้สาธารณะ', 'เป็นสถานที่ฝึกอาวุธ', 'เป็นศูนย์ค้าขายผ้าไหม', 'เป็นที่พักนักเดินทางต่างชาติ',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-wat-pho-learning', 'pretest',
 'สิ่งใดทำให้วัดโพธิ์เปรียบได้กับ "มหาวิทยาลัยกลางเมือง"',
 'มีการรวบรวมตำราและจารึกความรู้ให้ประชาชนเข้าถึงได้', 'มีอาคารเรียนและห้องสอบ', 'มีการสอนภาษาต่างประเทศ', 'มีห้องสมุดดิจิทัล',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-wat-pho-learning', 'pretest',
 'ความรู้ด้านใดที่วัดโพธิ์เป็นที่รู้จักในการอนุรักษ์',
 'แพทย์แผนไทยและการนวดโบราณ', 'วิทยาศาสตร์อวกาศ', 'วิศวกรรมสะพาน', 'การทำแก้วศิลปะ',
 'A', 'C'),

(NULL, 'rattanakosin', 'lore-wat-pho-learning', 'pretest',
 'จารึกในวัดโพธิ์มีความสำคัญอย่างไร',
 'บันทึกและถ่ายทอดความรู้ให้คนรุ่นหลัง', 'ใช้เป็นเงินตราโบราณ', 'เป็นแผนที่นำทางสำหรับนักรบ', 'ใช้ประดับตกแต่งเท่านั้น',
 'A', 'C'),

-- lore-silom-trade (district: silom)
(NULL, 'silom', 'lore-silom-trade', 'pretest',
 'ย่านสีลมเติบโตขึ้นมาจากสิ่งใดเป็นหลัก',
 'เส้นทางคมนาคมและการค้าขาย', 'การทำเหมืองแร่', 'การเกษตรกรรม', 'อุตสาหกรรมสิ่งทอ',
 'A', 'C'),

(NULL, 'silom', 'lore-silom-trade', 'pretest',
 'ย่านสีลมเชื่อมชุมชนใดเข้ากับเศรษฐกิจเมืองสมัยใหม่',
 'ชุมชนริมแม่น้ำเจ้าพระยา', 'ชุมชนบนภูเขาทางเหนือ', 'ชุมชนชาวเล', 'ชุมชนป่าดงดิบ',
 'A', 'C'),

(NULL, 'silom', 'lore-silom-trade', 'pretest',
 'บทบาทหลักของย่านสีลมในอดีตคืออะไร',
 'ศูนย์กลางการค้าและคมนาคมของกรุงเทพฯ', 'พื้นที่เกษตรกรรมชานเมือง', 'ค่ายทหารหลักของกรุงเทพฯ', 'ย่านที่พักอาศัยของราชวงศ์',
 'A', 'C'),

(NULL, 'silom', 'lore-silom-trade', 'pretest',
 'แม่น้ำเจ้าพระยามีความสัมพันธ์กับย่านสีลมอย่างไร',
 'เป็นเส้นทางการค้าและขนส่งที่เชื่อมสีลมกับเมือง', 'เป็นแหล่งน้ำดื่มเพียงอย่างเดียว', 'เป็นขอบเขตทางการปกครอง', 'ไม่มีความสัมพันธ์กัน',
 'A', 'C'),

-- lore-chatuchak-market (district: chatuchak)
(NULL, 'chatuchak', 'lore-chatuchak-market', 'pretest',
 'จตุจักรสะท้อนเศรษฐกิจประเภทใด',
 'เศรษฐกิจสร้างสรรค์ที่รวมงานฝีมือและวัฒนธรรม', 'เศรษฐกิจการผลิตอุตสาหกรรมหนัก', 'เศรษฐกิจการเกษตรส่งออก', 'เศรษฐกิจดิจิทัลล้วน',
 'A', 'C'),

(NULL, 'chatuchak', 'lore-chatuchak-market', 'pretest',
 'สินค้าประเภทใดที่จตุจักรเป็นที่รู้จัก',
 'งานฝีมือ อาหาร และของที่ระลึกพื้นเมือง', 'เครื่องจักรอุตสาหกรรม', 'อาวุธยุทโธปกรณ์', 'ยาและเวชภัณฑ์เท่านั้น',
 'A', 'C'),

(NULL, 'chatuchak', 'lore-chatuchak-market', 'pretest',
 '"ความทรงจำของคนเมือง" ที่จตุจักรสะท้อนให้เห็นหมายถึงอะไร',
 'วัฒนธรรมและประวัติศาสตร์ชีวิตคนกรุงเทพฯ', 'บันทึกสงครามโบราณ', 'ตำนานเทพปกรณัม', 'ประวัติราชวงศ์จักรี',
 'A', 'C'),

(NULL, 'chatuchak', 'lore-chatuchak-market', 'pretest',
 'จตุจักรมีบทบาทสำคัญต่อชุมชนเมืองอย่างไร',
 'เป็นพื้นที่แลกเปลี่ยนสินค้าและวัฒนธรรมของคนเมือง', 'เป็นพื้นที่ทางทหารเชิงยุทธศาสตร์', 'เป็นสถานที่ประกอบพิธีกรรมทางศาสนาเท่านั้น', 'เป็นศูนย์กลางราชการส่วนกลาง',
 'A', 'C')

ON CONFLICT (lore_id, question_th) DO NOTHING;

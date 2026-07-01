-- ══ Mock Test Seed — Satit Prasarnmit ══════════════════════════════════════
-- Purpose: field-test the full watchtower → support node → quiz → capture loop
--          using the actual school campus as the test arena.
-- Safe to re-run: all statements are idempotent.
-- Remove this file (and the rows it inserts) before production deploy.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. District ──────────────────────────────────────────────────────────────
-- Tight bounding box around the school. Required thresholds kept low (2/1/1)
-- so a solo tester can clear all support nodes in one visit.

INSERT INTO districts (
  id, name_th, name_en, province,
  center_lat, center_lng,
  watchtower_lat, watchtower_lng,
  required_cafes, required_otops, required_landmarks,
  polygon_coords, is_active
) VALUES (
  'satit_test',
  'สาธิตประสานมิตร [TEST]',
  'Satit Prasarnmit [TEST]',
  'Bangkok',
  13.74299, 100.56583,   -- campus centre
  13.74322, 100.56583,   -- main gate / watchtower pin
  2, 1, 1,               -- 2 cafes · 1 OTOP · 1 landmark to unlock S/A
  '[[13.7420,100.5645],[13.7420,100.5670],[13.7440,100.5670],[13.7440,100.5645],[13.7420,100.5645]]',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name_th          = EXCLUDED.name_th,
  center_lat       = EXCLUDED.center_lat,
  center_lng       = EXCLUDED.center_lng,
  watchtower_lat   = EXCLUDED.watchtower_lat,
  watchtower_lng   = EXCLUDED.watchtower_lng,
  required_cafes   = EXCLUDED.required_cafes,
  required_otops   = EXCLUDED.required_otops,
  required_landmarks = EXCLUDED.required_landmarks,
  polygon_coords   = EXCLUDED.polygon_coords,
  is_active        = EXCLUDED.is_active;

-- ── 2. Mock figure (B-tier) ───────────────────────────────────────────────────
-- Clearly labelled [TEST] so it won't be confused with production content.

INSERT INTO figures (id, name_th, name_en, class, legacy_pts, district_id,
                     description, image_emoji, lat, lng, is_active)
VALUES (
  'fig-mock-satit-b-01',
  'ผู้บุกเบิกสาธิต [TEST]',
  'Satit Pioneer [MOCK]',
  'B',
  40,
  'satit_test',
  'บุคคลตัวอย่างสำหรับทดสอบระบบ Capture Loop ที่โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร',
  '🎓',
  13.74322, 100.56583,
  true
)
ON CONFLICT (id) DO UPDATE SET
  district_id = EXCLUDED.district_id,
  lat         = EXCLUDED.lat,
  lng         = EXCLUDED.lng,
  is_active   = EXCLUDED.is_active;

-- ── 3. Support nodes ──────────────────────────────────────────────────────────
-- 4 nodes mapped to the coordinates provided.
-- Layout: 2 cafes (north end), 1 OTOP (east), 1 landmark (main building).
-- The node IDs also serve as the p_node_id argument in increment_node_visit().

INSERT INTO support_nodes (id, district_id, type, name, lat, lng) VALUES
-- 13°44'36.0"N 100°33'57.5"E  — canteen / north end
('node-satit-cafe-1',     'satit_test', 'cafe',     'โรงอาหารสาธิต ฝั่งเหนือ [TEST]',   13.74333, 100.56597),
-- 13°44'36.3"N 100°33'56.2"E  — faculty building
('node-satit-cafe-2',     'satit_test', 'cafe',     'คาเฟ่ตึกอาจารย์ [TEST]',             13.74342, 100.56561),
-- 13°44'34.5"N 100°33'57.4"E  — SWU co-op / bookshop
('node-satit-otop-1',     'satit_test', 'otop',     'ร้านสหกรณ์ มศว [TEST]',             13.74292, 100.56594),
-- 13°44'33.2"N 100°33'57.1"E  — school sign / front gate landmark
('node-satit-landmark-1', 'satit_test', 'landmark', 'ป้ายหน้าโรงเรียนสาธิตประสานมิตร [TEST]', 13.74256, 100.56586)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  lat  = EXCLUDED.lat,
  lng  = EXCLUDED.lng;

-- ── 4. Lore chain (3 nodes) ───────────────────────────────────────────────────
-- chain_id  : 'chain-satit-history'
-- chain_part: 1 → 2 → 3  (must all unlock for the full story to appear)
-- radius_m  : 100 m — loose enough to forgive normal phone GPS drift on campus.

INSERT INTO lore_nodes (
  id, name_th, name_en,
  lat, lng, radius_m, lore_pts,
  content_type, content_th, content_en,
  chain_id, chain_part, district_id, is_active
) VALUES
(
  'lore-satit-1',
  'กำเนิดวิทยาลัยประสานมิตร',
  'The Birth of Prasarnmit College',
  13.74333, 100.56597,   -- near support-1 (north canteen)
  100, 25, 'text',
  'ในปี พ.ศ. 2492 รัฐบาลไทยได้ก่อตั้ง "วิทยาลัยประสานมิตร" ขึ้นในย่านสุขุมวิท เพื่อเป็นสถาบันฝึกหัดครูระดับอุดมศึกษาแห่งแรกของประเทศ '
  'ชื่อ "ประสานมิตร" มาจากแนวคิดการประสานมิตรภาพระหว่างผู้เรียนและผู้สอน ซึ่งสะท้อนปรัชญาการศึกษาที่ให้ความสำคัญกับความสัมพันธ์มนุษย์มากกว่าการท่องจำ',
  'In 1949, the Thai government founded Prasarnmit College in the Sukhumvit area as the nation''s first university-level teacher-training institution. '
  'The name "Prasarnmit" (ประสานมิตร) means "bonding of friends," reflecting a philosophy that values human relationships over rote memorisation.',
  'chain-satit-history', 1, 'satit_test', true
),
(
  'lore-satit-2',
  'ก้าวสู่มหาวิทยาลัยศรีนครินทรวิโรฒ',
  'Becoming Srinakharinwirot University',
  13.74342, 100.56561,   -- near support-2 (faculty building)
  100, 25, 'text',
  'ปี พ.ศ. 2517 วิทยาลัยวิชาการศึกษาทั่วประเทศได้รวมตัวกันยกฐานะเป็น "มหาวิทยาลัยศรีนครินทรวิโรฒ" — ชื่อที่พระบาทสมเด็จพระเจ้าอยู่หัวรัชกาลที่ 9 '
  'พระราชทานให้เป็นเกียรติแก่สมเด็จพระศรีนครินทราบรมราชชนนี (สมเด็จย่า) "ศรีนครินทรวิโรฒ" แปลว่า "เจริญรุ่งเรืองแห่งเมือง" '
  'มหาวิทยาลัยแห่งนี้จึงเป็นสัญลักษณ์ของความก้าวหน้าทางการศึกษาและความจงรักภักดีต่อสถาบัน',
  'In 1974, the national network of Colleges of Education was unified and elevated to "Srinakharinwirot University" — a name bestowed by King Rama IX '
  'in honour of HRH Princess Srinagarindra (the Princess Mother). The name means "flourishing of the city," making the university a symbol of educational progress and royal devotion.',
  'chain-satit-history', 2, 'satit_test', true
),
(
  'lore-satit-3',
  'โรงเรียนสาธิตฯ: ห้องทดลองทางการศึกษา',
  'The Demonstration School as Living Lab',
  13.74292, 100.56594,   -- near support-3 (co-op / bookshop)
  100, 30, 'text',
  'โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร ไม่ได้เป็นเพียงโรงเรียนทั่วไป แต่ทำหน้าที่เป็น "ห้องทดลองทางการศึกษา" '
  'ให้นิสิตคณะศึกษาศาสตร์ได้ฝึกสอนในสภาพแวดล้อมจริง ขณะเดียวกันก็รับนักเรียนตั้งแต่ชั้นประถมจนถึงมัธยมปลาย '
  'แนวคิดนี้สอดคล้องกับทฤษฎี Situated Learning ที่เชื่อว่าความรู้จะฝังแน่นก็ต่อเมื่อเกิดขึ้นในบริบทจริง ไม่ใช่ในห้องเรียนจำลอง',
  'Satit Prasarnmit Demonstration School is not merely a school — it functions as a living laboratory for education. '
  'Education faculty students conduct real teaching practice here while the school simultaneously serves students from primary through secondary level. '
  'This mirrors the Situated Learning principle: knowledge becomes durable only when it emerges from authentic contexts, not simulated classrooms.',
  'chain-satit-history', 3, 'satit_test', true
)
ON CONFLICT (id) DO UPDATE SET
  content_th = EXCLUDED.content_th,
  content_en = EXCLUDED.content_en,
  is_active  = EXCLUDED.is_active,
  radius_m   = EXCLUDED.radius_m;

-- ── 5. Quiz questions (B-tier difficulty) ────────────────────────────────────
-- 3 questions tied to the mock figure and satit_test district.

INSERT INTO quiz_questions (figure_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty)
VALUES
(
  'fig-mock-satit-b-01', 'satit_test',
  'วิทยาลัยประสานมิตรก่อตั้งขึ้นในปี พ.ศ. ใด',
  'พ.ศ. 2492', 'พ.ศ. 2500', 'พ.ศ. 2517', 'พ.ศ. 2475',
  'A', 'B'
),
(
  'fig-mock-satit-b-01', 'satit_test',
  'ชื่อ "ศรีนครินทรวิโรฒ" ได้รับพระราชทานเพื่อเป็นเกียรติแก่ผู้ใด',
  'สมเด็จพระศรีนครินทราบรมราชชนนี (สมเด็จย่า)', 'สมเด็จพระนางเจ้าสิริกิติ์', 'พระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว', 'สมเด็จพระเจ้าตากสิน',
  'A', 'B'
),
(
  'fig-mock-satit-b-01', 'satit_test',
  'โรงเรียนสาธิตประสานมิตรทำหน้าที่สำคัญใดควบคู่กับการเป็นโรงเรียนปกติ',
  'เป็นสถานที่ฝึกสอนสำหรับนิสิตคณะศึกษาศาสตร์', 'เป็นสนามกีฬาแห่งชาติ', 'เป็นศูนย์วิจัยอวกาศ', 'เป็นตลาดนัดวิชาการ',
  'A', 'B'
)
ON CONFLICT DO NOTHING;

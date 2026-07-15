-- Thammasat University content: figure, lore, support nodes, Rangsit district + watchtower.
-- Rangsit is its own district (not folded into pathumwan's watchtowers) so it doesn't
-- gate Pathumwan's fog-clear for players who never travel to Pathum Thani province.

INSERT INTO districts (id, name_th, name_en, province, center_lat, center_lng, watchtower_lat, watchtower_lng, required_cafes, required_otops, required_landmarks, is_active)
VALUES ('rangsit', 'รังสิต', 'Rangsit', 'ปทุมธานี', 14.0716, 100.6072, 14.0716, 100.6072, 0, 0, 0, true)
ON CONFLICT (id) DO UPDATE SET
  name_th = EXCLUDED.name_th, name_en = EXCLUDED.name_en, province = EXCLUDED.province,
  center_lat = EXCLUDED.center_lat, center_lng = EXCLUDED.center_lng,
  watchtower_lat = EXCLUDED.watchtower_lat, watchtower_lng = EXCLUDED.watchtower_lng;

INSERT INTO figures (id, name_th, name_en, class, legacy_pts, district_id, description, bio_th, birth_year, death_year, lat, lng)
VALUES (
  'fig-a-21', 'สัญญา ธรรมศักดิ์', 'Sanya Dharmasakti', 'A', 200, 'pathumwan',
  'Rector of Thammasat University (1971-1973); appointed Prime Minister after the October 14, 1973 uprising. Later Chief Justice of the Supreme Court and President of the Privy Council (1975-1998).',
  'อธิการบดีมหาวิทยาลัยธรรมศาสตร์ (1 เมษายน 2514 – 16 ตุลาคม 2516) ได้รับพระบรมราชโองการโปรดเกล้าฯ แต่งตั้งเป็นนายกรัฐมนตรีคนที่ 12 หลังเหตุการณ์ 14 ตุลาคม 2516 (14 ต.ค. 2516 – 14 ก.พ. 2518) เคยดำรงตำแหน่งประธานศาลฎีกา และประธานองคมนตรี (2518–2541) สำเร็จการศึกษากฎหมายที่ The Middle Temple ประเทศอังกฤษ',
  1907, 2002, 13.7567, 100.4931
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lore_nodes (id, name_th, name_en, lat, lng, district_id, content_th, content_en, lore_pts)
VALUES (
  'lore-tu-history', 'กำเนิดมหาวิทยาลัยธรรมศาสตร์', 'The Founding of Thammasat University', 13.7567, 100.4931, 'pathumwan',
  'มหาวิทยาลัยธรรมศาสตร์ก่อตั้งเมื่อวันที่ 27 มิถุนายน 2477 ชื่อมหาวิทยาลัยแรกเริ่ม คือ "มหาวิทยาลัยวิชาธรรมศาสตร์และการเมือง" (มธก.) จากแนวคิดของศาสตราจารย์ดร.ปรีดี พนมยงค์ ที่ต้องการจัดตั้งมหาวิทยาลัยที่เน้นการเรียนการสอนเรื่องประชาธิปไตย เพื่อให้การศึกษาและสร้างความเข้าใจ ในระบอบการปกครองใหม่ที่เพิ่งถือกำเนิดขึ้นก่อนหน้านี้เพียง 2 ปีแก่พลเมืองจำนวนมากผู้อยู่ในภาวะกระหายใคร่รู้

"มหาวิทยาลัยย่อมอุปมา ประดุจบ่อน้ำ บำบัดความกระหายของราษฎร ผู้สมัครแสวงหาความรู้ อันเป็นสิทธิและโอกาส ที่เขาควรมีควรได้ ตามหลักเสรีภาพของการศึกษา"

ด้วยเหตุนี้มหาวิทยาลัยวิชาธรรมศาสตร์และการเมืองจึงมีลักษณะเป็นตลาดวิชา โดยเปิดกว้างแก่ผู้สำเร็จประโยคมัธยมศึกษาและผู้ที่ทำงานแล้วเข้าเรียนโดยไม่มีการสอบเข้า เก็บค่าเล่าเรียนในอัตราต่ำ จัดพิมพ์คำสอนจำหน่ายในราคาถูก ไม่บังคับให้นักศึกษาต้องมาฟังคำบรรยาย เพียงแต่มาสอบตามกำหนดเวลา นับเป็นมหาวิทยาลัยเปิดแห่งแรกของประเทศไทย ปรากฏว่า ในปีแรกมีผู้สมัครเข้าศึกษาถึง 7,094 คน ส่วนใหญ่ประกอบด้วยบุตรชายหญิงจากชนชั้นที่ไม่ได้ร่ำรวย รวมทั้งชนชั้นกลางที่มีความหลากหลายทางอาชีพ วิชาที่เปิดสอนมี 2 แขนงคือ หลักสูตรธรรมศาสตรบัณฑิตและวิชาการบัญชี',
  'Thammasat University was founded on 27 June 1934, originally named the "University of Moral and Political Science" (UMPS), from the vision of Professor Dr. Pridi Banomyong, who wanted to establish a university centered on teaching democracy — to educate and build understanding of the new system of government, born only two years earlier, among a citizenry eager to learn. Pridi described it: "A university is like a well, quenching the thirst of the people who seek knowledge — a right and an opportunity they should have, under the principle of educational freedom." As Thailand''s first open university, it admitted anyone who had completed secondary school or was already working, with no entrance exam, low tuition, cheap printed course materials, and no mandatory lecture attendance — only scheduled exams. In its first year, 7,094 people enrolled, mostly from working and middle classes across many professions. It opened two programs: a Bachelor of Laws/Moral Science and Accounting.',
  30
) ON CONFLICT (id) DO NOTHING;

INSERT INTO support_nodes (id, district_id, type, name, lat, lng)
VALUES
  ('node-tu-canteen', 'pathumwan', 'cafe', 'โรงอาหาร มธ. ท่าพระจันทร์', 13.7567, 100.4931),
  ('node-tu-thaprachan', 'pathumwan', 'landmark', 'มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์', 13.7567, 100.4931),
  ('node-tu-rangsit', 'rangsit', 'landmark', 'มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต (โดม)', 14.0716, 100.6072)
ON CONFLICT (id) DO NOTHING;

-- Capture-quiz questions for fig-a-21 (Sanya Dharmasakti)
INSERT INTO quiz_questions (figure_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty, is_raid_question)
SELECT * FROM (VALUES
  ('fig-a-21', 'pathumwan', 'ท่านสัญญา ธรรมศักดิ์ ดำรงตำแหน่งอธิการบดีมหาวิทยาลัยธรรมศาสตร์ในช่วงปีใด', 'พ.ศ. 2514-2516', 'พ.ศ. 2500-2510', 'พ.ศ. 2520-2525', 'พ.ศ. 2475-2480', 'A', 'B', false),
  ('fig-a-21', 'pathumwan', 'ท่านสัญญาได้รับแต่งตั้งเป็นนายกรัฐมนตรีหลังเหตุการณ์ใด', '14 ตุลาคม 2516', '6 ตุลาคม 2519', 'พฤษภาทมิฬ 2535', 'รัฐประหาร 2534', 'A', 'B', false),
  ('fig-a-21', 'pathumwan', 'ก่อนเข้าสู่แวดวงการเมือง ท่านสัญญาเคยดำรงตำแหน่งสูงสุดในองค์กรใด', 'ประธานศาลฎีกา', 'ผู้บัญชาการตำรวจแห่งชาติ', 'ผู้ว่าการธนาคารแห่งประเทศไทย', 'อธิบดีกรมตำรวจ', 'A', 'C', false),
  ('fig-a-21', 'pathumwan', 'หลังพ้นจากตำแหน่งนายกรัฐมนตรี ท่านสัญญาดำรงตำแหน่งใดยาวนานที่สุด', 'ประธานองคมนตรี', 'ประธานรัฐสภา', 'ประธานศาลรัฐธรรมนูญ', 'เลขาธิการสหประชาชาติ', 'A', 'C', false)
) AS v(figure_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty, is_raid_question)
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE figure_id = 'fig-a-21');

-- Pretest questions for lore-tu-history
INSERT INTO quiz_questions (lore_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty, is_raid_question, assessment_type, review_status)
SELECT * FROM (VALUES
  ('lore-tu-history', 'pathumwan', 'มหาวิทยาลัยธรรมศาสตร์ก่อตั้งขึ้นเมื่อปีใด', 'พ.ศ. 2477', 'พ.ศ. 2475', 'พ.ศ. 2500', 'พ.ศ. 2516', 'A', 'C', false, 'pretest', 'approved'),
  ('lore-tu-history', 'pathumwan', 'ชื่อแรกเริ่มของมหาวิทยาลัยธรรมศาสตร์คืออะไร', 'มหาวิทยาลัยวิชาธรรมศาสตร์และการเมือง', 'จุฬาลงกรณ์มหาวิทยาลัย', 'มหาวิทยาลัยวิชาการเมือง', 'มหาวิทยาลัยเสรีไทย', 'A', 'C', false, 'pretest', 'approved'),
  ('lore-tu-history', 'pathumwan', 'ใครคือผู้ก่อตั้งมหาวิทยาลัยธรรมศาสตร์', 'ศ.ดร.ปรีดี พนมยงค์', 'จอมพล ป. พิบูลสงคราม', 'พระยาพหลพลพยุหเสนา', 'สัญญา ธรรมศักดิ์', 'A', 'C', false, 'pretest', 'approved'),
  ('lore-tu-history', 'pathumwan', 'มหาวิทยาลัยธรรมศาสตร์ในยุคแรกมีลักษณะเด่นอย่างไร', 'เป็นมหาวิทยาลัยเปิดแห่งแรกของไทย ไม่มีการสอบเข้า', 'รับเฉพาะบุตรหลานขุนนาง', 'สอนเฉพาะภาษาต่างประเทศ', 'เก็บค่าเล่าเรียนแพงที่สุดในประเทศ', 'A', 'C', false, 'pretest', 'approved')
) AS v(lore_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty, is_raid_question, assessment_type, review_status)
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lore_id = 'lore-tu-history');

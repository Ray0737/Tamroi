-- Removes fig-b-15 (Prince Rabi Bodhanabaya) and fig-a-17 (Prince Dhani Nivat) —
-- user flagged both for removal from the collection screenshots (Class A, dusit).
-- Replaces them with two non-monarchy Class A figures tied to the same district:
-- Mario Tamagno (Italian court architect, Ananta Samakhom Throne Hall / Government House)
-- and Field Marshal Sarit Thanarat (governed from Government House, founded the
-- National Economic Development Board + National Education Council in 1959).
-- Applied live via Supabase MCP 2026-07-15; this file makes the change reproducible.

DELETE FROM quiz_questions WHERE figure_id IN ('fig-b-15', 'fig-a-17');
DELETE FROM figures WHERE id IN ('fig-b-15', 'fig-a-17');

INSERT INTO figures (id, name_th, name_en, class, legacy_pts, district_id, description, image_emoji, is_active, raid_only, lat, lng) VALUES
('fig-a-22', 'มาริโอ ตามัญโญ', 'Mario Tamagno', 'A', 200, 'dusit',
 'Italian architect who entered Siamese royal service in 1900. Chief designer of Ananta Samakhom Throne Hall (Carrara marble, Renaissance/Neo-Classical style), the building that later became Thailand''s first Parliament House. Also designed Amphorn Sathan Residential Hall, Government House, and Bangkok''s Hua Lamphong Railway Station.',
 '🏛️', true, false, 13.7723, 100.5148),
('fig-a-23', 'จอมพลสฤษดิ์ ธนะรัชต์', 'Field Marshal Sarit Thanarat', 'A', 200, 'dusit',
 'Prime Minister who governed from Government House in Dusit (1959-1963). Established the National Economic Development Board (now NESDB) and the National Education Council in 1959, laying the institutional foundation for Thailand''s modern economic-planning system.',
 '🏢', true, false, 13.7658, 100.5158);

INSERT INTO quiz_questions (figure_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty, assessment_type) VALUES
('fig-a-22', 'dusit', 'มาริโอ ตามัญโญ เป็นสถาปนิกชาติใด และออกแบบอาคารใดในดุสิต?', 'อิตาลี — พระที่นั่งอนันตสมาคม', 'ฝรั่งเศส — พระที่นั่งวิมานเมฆ', 'อังกฤษ — วัดเบญจมบพิตร', 'เยอรมนี — สวนสัตว์ดุสิต', 'A', 'medium', 'capture'),
('fig-a-22', 'dusit', 'พระที่นั่งอนันตสมาคมภายหลังถูกใช้เป็นสถานที่ใด?', 'รัฐสภาแห่งแรกของไทย', 'ทำเนียบรัฐบาล', 'ศาลยุติธรรม', 'สถานีรถไฟ', 'A', 'medium', 'capture'),
('fig-a-22', 'dusit', 'พระที่นั่งอนันตสมาคมสร้างด้วยวัสดุหลักใด?', 'หินอ่อนคาร์รารา นำเข้าจากอิตาลี', 'ไม้สักทองทั้งหลัง', 'อิฐมอญฉาบปูน', 'คอนกรีตเสริมเหล็ก', 'A', 'medium', 'capture'),
('fig-a-23', 'dusit', 'จอมพลสฤษดิ์ ธนะรัชต์ บริหารประเทศจากสถานที่ใดในเขตดุสิต?', 'ทำเนียบรัฐบาล', 'พระที่นั่งอนันตสมาคม', 'วังปารุสกวัน', 'พระที่นั่งวิมานเมฆ', 'A', 'medium', 'capture'),
('fig-a-23', 'dusit', 'จอมพลสฤษดิ์ ธนะรัชต์ ก่อตั้งหน่วยงานใดในปี พ.ศ. 2502?', 'สภาพัฒนาการเศรษฐกิจแห่งชาติ และสภาการศึกษาแห่งชาติ', 'ธนาคารแห่งประเทศไทย', 'กระทรวงมหาดไทย', 'กรมทางหลวง', 'A', 'medium', 'capture'),
('fig-a-23', 'dusit', 'จอมพลสฤษดิ์ ธนะรัชต์ ดำรงตำแหน่งนายกรัฐมนตรีในช่วงปีใด?', 'พ.ศ. 2502–2506', 'พ.ศ. 2481–2487', 'พ.ศ. 2516–2519', 'พ.ศ. 2475–2476', 'A', 'medium', 'capture');

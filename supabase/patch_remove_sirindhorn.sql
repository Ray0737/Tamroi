-- Replace fig-s-19 (Princess Sirindhorn) with a non-royal S-tier figure.
-- She is not a reigning king, so patch_remove_all_rama.sql's literal rule
-- didn't cover her, but she is a living member of the current reigning
-- family — same content-sensitivity class as the Rama-line removal.
-- Applied directly to production 2026-07-12; this patch makes it reproducible.

DELETE FROM quiz_questions WHERE figure_id = 'fig-s-19';
DELETE FROM figures WHERE id = 'fig-s-19';

INSERT INTO figures (id, name_th, name_en, class, legacy_pts, district_id, description, image_emoji, lat, lng, is_active, raid_only)
VALUES (
  'fig-s-19',
  'เจ้าพระยาบดินทรเดชา (สิงห์ สิงหเสนี)',
  'Chao Phraya Bodindecha (Sing Singhaseni)',
  'S', 500, 'dusit',
  'Supreme commander of the Siamese army under King Rama III; led the Siamese–Vietnamese War (Anam Sayam Yut) and campaigns across Cambodia and Laos, defending and expanding Siam''s borders for over a decade. One of the most celebrated non-royal military statesmen of the early Rattanakosin era.',
  '⚔️', 13.7705000, 100.5100000, true, false
)
ON CONFLICT (id) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  image_emoji = EXCLUDED.image_emoji;

INSERT INTO quiz_questions (figure_id, district_id, question_th, option_a, option_b, option_c, option_d, correct_option, difficulty)
VALUES
  ('fig-s-19', 'dusit', 'เจ้าพระยาบดินทรเดชา (สิงห์ สิงหเสนี) ดำรงตำแหน่งแม่ทัพใหญ่ในรัชกาลใด?', 'รัชกาลที่ 1', 'รัชกาลที่ 3', 'รัชกาลที่ 5', 'รัชกาลที่ 7', 'B', 'easy'),
  ('fig-s-19', 'dusit', 'สงครามครั้งสำคัญที่เจ้าพระยาบดินทรเดชาเป็นแม่ทัพใหญ่คือสงครามใด?', 'สงครามเก้าทัพ', 'สงครามยุทธหัตถี', 'อานัมสยามยุทธ', 'สงครามโลกครั้งที่ 1', 'C', 'hard');

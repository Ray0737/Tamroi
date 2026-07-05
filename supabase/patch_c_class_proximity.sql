-- patch_c_class_proximity.sql
-- Adds placeholder C-class figures for districts with no coverage.
-- Sukhumvit, Watthana, Ladphrao previously had none.

INSERT INTO figures (id, name_th, name_en, class, legacy_pts, district_id, description, image_emoji, lat, lng)
VALUES
  ('fig-c-17', 'พ่อค้าโบราณ',      'Ancient Trader',    'C', 50, 'sukhumvit', 'พ่อค้าท้องถิ่นผู้สืบทอดวัฒนธรรมการค้าในย่านสุขุมวิท', '🧑', 13.7360, 100.5590),
  ('fig-c-18', 'ชาวบ้านวัฒนา',     'Watthana Villager', 'C', 50, 'watthana',  'ชาวบ้านดั้งเดิมในย่านวัฒนาผู้เชี่ยวชาญงานหัตถกรรม',    '👤', 13.7310, 100.5820),
  ('fig-c-19', 'ครูสอนศิลป์',       'Art Teacher',       'C', 50, 'ladphrao',  'ครูท้องถิ่นผู้อนุรักษ์ศิลปะพื้นบ้านในย่านลาดพร้าว',     '🎨', 13.8120, 100.5880)
ON CONFLICT (id) DO NOTHING;

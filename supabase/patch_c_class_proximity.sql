-- patch_c_class_proximity.sql
-- Ensures every proximity-capture pilot district (sukhumvit, watthana, ladphrao)
-- has a C-class figure with coordinates.
-- NOTE: ids fig-c-17..20 were already taken by other figures in the live DB,
-- and watthana already had a C-class figure (fig-c-14) missing lat/lng —
-- so this inserts 2 new figures and backfills coords on fig-c-14.
-- Applied to production 2026-07-05.

INSERT INTO figures (id, name_th, name_en, class, legacy_pts, district_id, description, image_emoji, lat, lng)
VALUES
  ('fig-c-21', 'พ่อค้าโบราณ', 'Ancient Trader', 'C', 50, 'sukhumvit', 'พ่อค้าท้องถิ่นผู้สืบทอดวัฒนธรรมการค้าในย่านสุขุมวิท', '🧑', 13.7360, 100.5590),
  ('fig-c-22', 'ครูสอนศิลป์',  'Art Teacher',    'C', 50, 'ladphrao',  'ครูท้องถิ่นผู้อนุรักษ์ศิลปะพื้นบ้านในย่านลาดพร้าว',   '🎨', 13.8120, 100.5880)
ON CONFLICT (id) DO NOTHING;

-- Watthana's existing C-class figure had no coords, so it never rendered on the map.
UPDATE figures SET lat = 13.7310, lng = 100.5820 WHERE id = 'fig-c-14' AND lat IS NULL;

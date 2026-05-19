-- ============================================================
-- Tamroi District Seed Patch
-- Adds MVP districts that exist in js/map.js but may be missing
-- from the initial schema.sql seed.
-- ============================================================

INSERT INTO districts (
  id, name_th, name_en, province,
  center_lat, center_lng, watchtower_lat, watchtower_lng,
  required_cafes, required_otops, required_landmarks,
  polygon_coords, is_active
) VALUES
('dusit', 'ดุสิต-พระนคร', 'Dusit-Phra Nakhon', 'Bangkok',
  13.7740, 100.5109, 13.7740, 100.5109, 2, 1, 3,
  '[[13.762,100.500],[13.762,100.523],[13.786,100.523],[13.786,100.500],[13.762,100.500]]', true),
('pathumwan', 'ปทุมวัน-สยาม', 'Pathumwan-Siam', 'Bangkok',
  13.7442, 100.5320, 13.7442, 100.5320, 2, 1, 2,
  '[[13.732,100.517],[13.732,100.545],[13.752,100.545],[13.752,100.517],[13.732,100.517]]', true),
('watthana', 'วัฒนา-ทองหล่อ', 'Watthana-Thonglor', 'Bangkok',
  13.7297, 100.5826, 13.7297, 100.5826, 3, 1, 2,
  '[[13.718,100.568],[13.718,100.596],[13.742,100.596],[13.742,100.568],[13.718,100.568]]', true),
('bang_kapi', 'บางกะปิ-มีนบุรี', 'Bang Kapi', 'Bangkok',
  13.7775, 100.6392, 13.7775, 100.6392, 2, 1, 2,
  '[[13.760,100.615],[13.760,100.660],[13.795,100.660],[13.795,100.615],[13.760,100.615]]', true),
('phra_khanong', 'พระโขนง-อ่อนนุช', 'Phra Khanong', 'Bangkok',
  13.7009, 100.5953, 13.7009, 100.5953, 2, 1, 2,
  '[[13.688,100.582],[13.688,100.612],[13.714,100.612],[13.714,100.582],[13.688,100.582]]', true),
('bang_na', 'บางนา-สุวรรณภูมิ', 'Bang Na', 'Bangkok',
  13.6571, 100.6123, 13.6571, 100.6123, 2, 2, 2,
  '[[13.642,100.594],[13.642,100.632],[13.672,100.632],[13.672,100.594],[13.642,100.594]]', true),
('nonthaburi', 'นนทบุรี', 'Nonthaburi', 'Nonthaburi',
  13.8621, 100.5144, 13.8621, 100.5144, 2, 1, 2,
  '[[13.848,100.500],[13.848,100.530],[13.876,100.530],[13.876,100.500],[13.848,100.500]]', true)
ON CONFLICT (id) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  name_en = EXCLUDED.name_en,
  province = EXCLUDED.province,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng,
  watchtower_lat = EXCLUDED.watchtower_lat,
  watchtower_lng = EXCLUDED.watchtower_lng,
  required_cafes = EXCLUDED.required_cafes,
  required_otops = EXCLUDED.required_otops,
  required_landmarks = EXCLUDED.required_landmarks,
  polygon_coords = EXCLUDED.polygon_coords,
  is_active = EXCLUDED.is_active;

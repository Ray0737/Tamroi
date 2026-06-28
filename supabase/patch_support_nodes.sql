-- ============================================================
-- patch_support_nodes.sql
-- Also creates bts_mrt_stations table (section 5)
-- 1. Add lat/lng columns to figures
-- 2. Seed figure map positions
-- 3. Create support_nodes table
-- 4. Seed all 47 support nodes (cafes, OTOP, landmarks)
-- ============================================================

-- ── 1. Add coordinates to figures ──────────────────────────
ALTER TABLE figures ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7);
ALTER TABLE figures ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7);

-- Fix class constraint to include B class (already in DB but schema.sql was outdated)
ALTER TABLE figures DROP CONSTRAINT IF EXISTS figures_class_check;
ALTER TABLE figures ADD CONSTRAINT figures_class_check CHECK (class IN ('S','A','B','C'));

-- ── 2. Seed figure positions ────────────────────────────────
UPDATE figures SET lat = 13.7479, lng = 100.4918, district_id = 'rattanakosin' WHERE id = 'fig-s-01';
UPDATE figures SET lat = 13.7510, lng = 100.4927, district_id = 'rattanakosin' WHERE id = 'fig-s-02';
UPDATE figures SET lat = 13.7450, lng = 100.4985, district_id = 'rattanakosin' WHERE id = 'fig-a-01';
UPDATE figures SET lat = 13.7532, lng = 100.4942, district_id = 'rattanakosin' WHERE id = 'fig-b-04';
UPDATE figures SET lat = 13.7395, lng = 100.5001, district_id = 'rattanakosin' WHERE id = 'fig-c-01';
UPDATE figures SET lat = 13.7412, lng = 100.4978, district_id = 'rattanakosin' WHERE id = 'fig-c-02';
UPDATE figures SET lat = 13.7634, lng = 100.5180, district_id = 'dusit'        WHERE id = 'fig-s-03';
UPDATE figures SET lat = 13.7700, lng = 100.5150, district_id = 'dusit'        WHERE id = 'fig-b-01';
UPDATE figures SET lat = 13.7786, lng = 100.5181, district_id = 'dusit'        WHERE id = 'fig-c-09';
UPDATE figures SET lat = 13.7406, lng = 100.5322, district_id = 'pathumwan'    WHERE id = 'fig-s-04';
UPDATE figures SET lat = 13.7400, lng = 100.5266, district_id = 'pathumwan'    WHERE id = 'fig-a-03';
UPDATE figures SET lat = 13.7448, lng = 100.5302, district_id = 'pathumwan'    WHERE id = 'fig-c-05';
UPDATE figures SET lat = 13.7254, lng = 100.5236, district_id = 'silom'        WHERE id = 'fig-s-14';
UPDATE figures SET lat = 13.7260, lng = 100.5295, district_id = 'silom'        WHERE id = 'fig-b-06';
UPDATE figures SET lat = 13.7268, lng = 100.5285, district_id = 'silom'        WHERE id = 'fig-c-08';
UPDATE figures SET lat = 13.7368, lng = 100.5580, district_id = 'sukhumvit'    WHERE id = 'fig-a-06';
UPDATE figures SET lat = 13.7297, lng = 100.5780, district_id = 'watthana'     WHERE id = 'fig-b-16';
UPDATE figures SET lat = 13.7990, lng = 100.5500, district_id = 'chatuchak'    WHERE id = 'fig-c-04';
UPDATE figures SET lat = 13.8020, lng = 100.5530, district_id = 'chatuchak'    WHERE id = 'fig-b-18';
UPDATE figures SET lat = 13.7640, lng = 100.6100, district_id = 'bang_kapi'    WHERE id = 'fig-c-13';
UPDATE figures SET lat = 13.6681, lng = 100.6018, district_id = 'bang_na'      WHERE id = 'fig-b-07';
UPDATE figures SET lat = 13.6590, lng = 100.6130, district_id = 'bang_na'      WHERE id = 'fig-c-07';
UPDATE figures SET lat = 13.7100, lng = 100.5985, district_id = 'phra_khanong' WHERE id = 'fig-c-16';
UPDATE figures SET lat = 13.8621, lng = 100.5144, district_id = 'nonthaburi'   WHERE id = 'fig-c-06';
UPDATE figures SET lat = 14.3692, lng = 100.5878, district_id = 'ayutthaya'    WHERE id = 'fig-s-10';
UPDATE figures SET lat = 14.3505, lng = 100.5648, district_id = 'ayutthaya'    WHERE id = 'fig-s-09';

-- ── 3. Create support_nodes table ──────────────────────────
CREATE TABLE IF NOT EXISTS support_nodes (
  id          TEXT PRIMARY KEY,
  district_id TEXT REFERENCES districts(id),
  type        TEXT CHECK (type IN ('cafe','otop','landmark')) NOT NULL,
  name        TEXT NOT NULL,
  lat         NUMERIC(10,7) NOT NULL,
  lng         NUMERIC(10,7) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE
);

ALTER TABLE support_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public support_nodes" ON support_nodes FOR SELECT USING (true);

-- ── 4. Seed support nodes ───────────────────────────────────
INSERT INTO support_nodes (id, district_id, type, name, lat, lng) VALUES
-- Rattanakosin
('node-rattanakosin-cafe-1',     'rattanakosin', 'cafe',     'ร้านกาแฟโบราณ',         13.7480, 100.4910),
('node-rattanakosin-cafe-2',     'rattanakosin', 'cafe',     'Café Chakri',            13.7520, 100.4960),
('node-rattanakosin-otop-1',     'rattanakosin', 'otop',     'OTOP ผ้าไทย',            13.7560, 100.4980),
('node-rattanakosin-landmark-1', 'rattanakosin', 'landmark', 'วัดพระแก้ว',             13.7510, 100.4930),
('node-rattanakosin-landmark-2', 'rattanakosin', 'landmark', 'พระบรมมหาราชวัง',        13.7565, 100.4925),
('node-rattanakosin-landmark-3', 'rattanakosin', 'landmark', 'วัดโพธิ์',               13.7459, 100.4883),
-- Dusit
('node-dusit-landmark-1',        'dusit',        'landmark', 'พระที่นั่งวิมานเมฆ',     13.7750, 100.5130),
('node-dusit-landmark-2',        'dusit',        'landmark', 'วัดเบญจมบพิตร',          13.7680, 100.5080),
('node-dusit-cafe-1',            'dusit',        'cafe',     'Tha Phra Chan Café',     13.7720, 100.5100),
('node-dusit-otop-1',            'dusit',        'otop',     'OTOP ของที่ระลึก',       13.7780, 100.5150),
-- Pathumwan
('node-pathumwan-landmark-1',    'pathumwan',    'landmark', 'ศาลท้าวมหาพรหม',         13.7440, 100.5350),
('node-pathumwan-cafe-1',        'pathumwan',    'cafe',     'Siam Square Coffee',     13.7430, 100.5280),
('node-pathumwan-otop-1',        'pathumwan',    'otop',     'OTOP สยาม',              13.7470, 100.5320),
-- Silom
('node-silom-cafe-1',            'silom',        'cafe',     'Silom Coffee Roasters',  13.7250, 100.5280),
('node-silom-otop-1',            'silom',        'otop',     'OTOP เครื่องหนัง',       13.7280, 100.5310),
('node-silom-landmark-1',        'silom',        'landmark', 'ศาลเจ้าพ่อเสือ',         13.7240, 100.5350),
-- Sukhumvit
('node-sukhumvit-cafe-1',        'sukhumvit',    'cafe',     'Asok Coffee House',      13.7330, 100.5580),
('node-sukhumvit-otop-1',        'sukhumvit',    'otop',     'OTOP Terminal 21',       13.7360, 100.5630),
('node-sukhumvit-landmark-1',    'sukhumvit',    'landmark', 'บ้านจิม ทอมป์สัน',       13.7454, 100.5290),
-- Watthana
('node-watthana-cafe-1',         'watthana',     'cafe',     'Thonglor Café',          13.7280, 100.5770),
('node-watthana-cafe-2',         'watthana',     'cafe',     'Ekkamai Coffee Roasters',13.7220, 100.5840),
('node-watthana-cafe-3',         'watthana',     'cafe',     'Phrom Phong Brew',       13.7350, 100.5730),
('node-watthana-otop-1',         'watthana',     'otop',     'OTOP ของฝาก Thonglor',   13.7310, 100.5720),
-- Chatuchak
('node-chatuchak-cafe-1',        'chatuchak',    'cafe',     'JJ Market Coffee',       13.8000, 100.5490),
('node-chatuchak-otop-1',        'chatuchak',    'otop',     'ตลาดนัดจตุจักร',          13.8030, 100.5530),
('node-chatuchak-landmark-1',    'chatuchak',    'landmark', 'สวนจตุจักร',              13.7970, 100.5440),
-- Ladphrao
('node-ladphrao-cafe-1',         'ladphrao',     'cafe',     'Ladphrao Coffee',        13.8080, 100.5820),
('node-ladphrao-otop-1',         'ladphrao',     'otop',     'OTOP ลาดพร้าว',          13.8140, 100.5880),
('node-ladphrao-landmark-1',     'ladphrao',     'landmark', 'วัดลาดพร้าว',            13.8200, 100.5910),
-- Bang Kapi
('node-bangkapi-landmark-1',     'bang_kapi',    'landmark', 'วัดบางกะปิ',              13.7740, 100.6350),
('node-bangkapi-cafe-1',         'bang_kapi',    'cafe',     'The Mall Café',          13.7780, 100.6420),
('node-bangkapi-otop-1',         'bang_kapi',    'otop',     'OTOP มีนบุรี',            13.7810, 100.6280),
-- Phra Khanong
('node-phrakhanong-cafe-1',      'phra_khanong', 'cafe',     'On Nut Coffee',          13.7000, 100.5930),
('node-phrakhanong-otop-1',      'phra_khanong', 'otop',     'OTOP On Nut',            13.7030, 100.5970),
('node-phrakhanong-landmark-1',  'phra_khanong', 'landmark', 'วัดพระโขนง',             13.6960, 100.5880),
-- Bang Na
('node-bangna-landmark-1',       'bang_na',      'landmark', 'วัดบางนา',               13.6580, 100.6120),
('node-bangna-otop-1',           'bang_na',      'otop',     'OTOP Bang Na',           13.6520, 100.6070),
('node-bangna-cafe-1',           'bang_na',      'cafe',     'Suvarnabhumi Café',      13.6640, 100.6200),
-- Nonthaburi
('node-nonthaburi-landmark-1',   'nonthaburi',   'landmark', 'วัดเฉลิมพระเกียรติ',     13.8620, 100.5150),
('node-nonthaburi-cafe-1',       'nonthaburi',   'cafe',     'Nonthaburi Riverside Café', 13.8570, 100.5100),
('node-nonthaburi-otop-1',       'nonthaburi',   'otop',     'ตลาดนนทบุรี',             13.8650, 100.5200),
-- Ayutthaya
('node-ayutthaya-cafe-1',        'ayutthaya',    'cafe',     'ร้านกาแฟเกาะเมือง',      14.3570, 100.5760),
('node-ayutthaya-cafe-2',        'ayutthaya',    'cafe',     'Ayutthaya Heritage Café',14.3630, 100.5900),
('node-ayutthaya-otop-1',        'ayutthaya',    'otop',     'OTOP ของฝากอยุธยา',      14.3600, 100.5830),
('node-ayutthaya-landmark-1',    'ayutthaya',    'landmark', 'วัดพระศรีสรรเพชญ์',      14.3505, 100.5648),
('node-ayutthaya-landmark-2',    'ayutthaya',    'landmark', 'วัดใหญ่ชัยมงคล',         14.3685, 100.5869),
('node-ayutthaya-landmark-3',    'ayutthaya',    'landmark', 'พระราชวังบางปะอิน',       14.3660, 100.5583)
ON CONFLICT (id) DO UPDATE SET
  district_id = EXCLUDED.district_id,
  type        = EXCLUDED.type,
  name        = EXCLUDED.name,
  lat         = EXCLUDED.lat,
  lng         = EXCLUDED.lng;

-- ── 5. BTS/MRT stations for transport multiplier ────────────
CREATE TABLE IF NOT EXISTS bts_mrt_stations (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  lat      NUMERIC(10,7) NOT NULL,
  lng      NUMERIC(10,7) NOT NULL,
  radius_m INTEGER DEFAULT 300
);
ALTER TABLE bts_mrt_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public bts_mrt_stations" ON bts_mrt_stations;
CREATE POLICY "Public bts_mrt_stations" ON bts_mrt_stations FOR SELECT USING (true);

INSERT INTO bts_mrt_stations (name, lat, lng, radius_m) VALUES
('Siam BTS',           13.7455, 100.5348, 300),
('Asok BTS',           13.7370, 100.5604, 300),
('Mo Chit BTS',        13.8026, 100.5538, 300),
('Sala Daeng BTS',     13.7286, 100.5341, 300),
('Sanam Chai MRT',     13.7437, 100.4941, 300),
('Chatuchak Park MRT', 13.8021, 100.5530, 300)
ON CONFLICT DO NOTHING;

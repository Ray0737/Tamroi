-- ============================================================
-- NSC Prototype 06 — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Profiles (extends auth.users) ──────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  legacy_score  INTEGER DEFAULT 0,
  map_discovery NUMERIC(5,2) DEFAULT 0,  -- percentage 0-100
  archive_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Districts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS districts (
  id                  TEXT PRIMARY KEY,
  name_th             TEXT NOT NULL,
  name_en             TEXT NOT NULL,
  province            TEXT NOT NULL,
  center_lat          NUMERIC(10,7) NOT NULL,
  center_lng          NUMERIC(10,7) NOT NULL,
  watchtower_lat      NUMERIC(10,7),
  watchtower_lng      NUMERIC(10,7),
  required_cafes      INTEGER DEFAULT 2,
  required_otops      INTEGER DEFAULT 1,
  required_landmarks  INTEGER DEFAULT 3,
  polygon_coords      JSONB,        -- simplified [[lat,lng],...] array
  is_active           BOOLEAN DEFAULT TRUE
);

-- Seed Bangkok districts
INSERT INTO districts (id, name_th, name_en, province, center_lat, center_lng, watchtower_lat, watchtower_lng, polygon_coords) VALUES
('rattanakosin',  'รัตนโกสินทร์', 'Rattanakosin',  'Bangkok', 13.7519, 100.4930, 13.7519, 100.4930,
  '[[13.743,100.485],[13.743,100.502],[13.760,100.502],[13.760,100.485],[13.743,100.485]]'),
('silom',         'สีลม-บางรัก',  'Silom-Bangrak', 'Bangkok', 13.7274, 100.5329, 13.7274, 100.5329,
  '[[13.718,100.518],[13.718,100.540],[13.735,100.540],[13.735,100.518],[13.718,100.518]]'),
('sukhumvit',     'สุขุมวิท',     'Sukhumvit',     'Bangkok', 13.7339, 100.5614, 13.7339, 100.5614,
  '[[13.720,100.553],[13.720,100.585],[13.745,100.585],[13.745,100.553],[13.720,100.553]]'),
('chatuchak',     'จตุจักร',      'Chatuchak',     'Bangkok', 13.8022, 100.5507, 13.8022, 100.5507,
  '[[13.792,100.540],[13.792,100.570],[13.815,100.570],[13.815,100.540],[13.792,100.540]]'),
('ladphrao',      'ลาดพร้าว',     'Ladphrao',      'Bangkok', 13.8100, 100.5900, 13.8100, 100.5900,
  '[[13.795,100.570],[13.795,100.610],[13.825,100.610],[13.825,100.570],[13.795,100.570]]')
ON CONFLICT (id) DO NOTHING;

-- ── Historical Figures ──────────────────────────────────
CREATE TABLE IF NOT EXISTS figures (
  id           TEXT PRIMARY KEY,
  name_th      TEXT NOT NULL,
  name_en      TEXT NOT NULL,
  class        TEXT CHECK (class IN ('S','A','C')) NOT NULL,
  legacy_pts   INTEGER NOT NULL,
  district_id  TEXT REFERENCES districts(id),
  description  TEXT,
  image_emoji  TEXT DEFAULT '👤',
  is_active    BOOLEAN DEFAULT TRUE
);

INSERT INTO figures (id, name_th, name_en, class, legacy_pts, district_id, description, image_emoji) VALUES
('king-taksin',    'สมเด็จพระเจ้าตากสิน',   'King Taksin the Great',  'S', 500, 'rattanakosin', 'กษัตริย์ผู้กอบกู้อาณาจักรไทยหลังเสียกรุงครั้งที่สอง', '👑'),
('rama-i',         'พระบาทสมเด็จพระพุทธยอดฟ้า', 'King Rama I',           'S', 500, 'rattanakosin', 'ปฐมกษัตริย์แห่งราชวงศ์จักรี ผู้สร้างกรุงรัตนโกสินทร์', '⚔️'),
('sunthon-phu',    'สุนทรภู่',               'Sunthorn Phu',           'A', 200, 'rattanakosin', 'กวีเอกแห่งรัตนโกสินทร์ ผู้แต่งพระอภัยมณี',            '📜'),
('si-suriyothai',  'สมเด็จพระศรีสุริโยทัย', 'Sri Suriyothai',          'A', 200, 'rattanakosin', 'วีรสตรีไทยผู้เสียสละพระชนม์ชีพเพื่อปกป้องพระเจ้าตากสิน','🛡️'),
('village-elder',  'ขุนนางท้องถิ่น',         'Local Village Legend',   'C',  50, 'silom',        'ผู้นำชุมชนริมแม่น้ำเจ้าพระยาในยุคต้นรัตนโกสินทร์',    '🎋'),
('otop-master',    'ช่างฝีมือ OTOP',          'OTOP Craft Master',      'C',  50, 'chatuchak',    'ช่างฝีมือท้องถิ่นผู้สืบทอดศิลปะไทยโบราณ',             '🪆'),
('river-merchant', 'พ่อค้าแม่น้ำ',            'River Merchant',         'C',  50, 'silom',        'พ่อค้าที่ร่ำรวยจากการค้าทางแม่น้ำในยุคสมัยใหม่',       '⚓')
ON CONFLICT (id) DO NOTHING;

-- ── User Districts (fog state) ──────────────────────────
CREATE TABLE IF NOT EXISTS user_districts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE,
  district_id       TEXT REFERENCES districts(id),
  fogged            BOOLEAN DEFAULT TRUE,
  cafes_visited     INTEGER DEFAULT 0,
  otops_visited     INTEGER DEFAULT 0,
  landmarks_visited INTEGER DEFAULT 0,
  checked_in_at     TIMESTAMPTZ,
  UNIQUE (user_id, district_id)
);

-- ── User Captures ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_captures (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  figure_id    TEXT REFERENCES figures(id),
  captured_at  TIMESTAMPTZ DEFAULT NOW(),
  quiz_score   INTEGER DEFAULT 0,
  UNIQUE (user_id, figure_id)
);

-- ── Artifacts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifacts (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  rarity       TEXT CHECK (rarity IN ('common','rare','legendary')) DEFAULT 'common',
  district_id  TEXT REFERENCES districts(id),
  icon         TEXT DEFAULT '📦',
  description  TEXT
);

INSERT INTO artifacts (id, name, rarity, district_id, icon, description) VALUES
('bronze-sword',   'ดาบโบราณ',      'legendary', 'rattanakosin', '⚔️',  'ดาบสมัยอยุธยาที่ค้นพบใกล้วัดพระแก้ว'),
('old-map',        'แผนที่โบราณ',   'rare',      'rattanakosin', '🗺️',  'แผนที่กรุงเทพฯ ยุคต้นรัตนโกสินทร์'),
('ceramic-bowl',   'ถ้วยเซรามิก',   'common',    'silom',        '🏺',  'เครื่องปั้นดินเผาลายคราม'),
('silk-fragment',  'ผ้าไหมโบราณ',   'rare',      'sukhumvit',    '🧵',  'ผ้าไหมไทยจากยุคสมัยรัชกาลที่ 5'),
('temple-bell',    'ระฆังวัด',      'common',    'chatuchak',    '🔔',  'ระฆังสำริดจากวัดร้างในย่านจตุจักร')
ON CONFLICT (id) DO NOTHING;

-- ── User Artifacts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_artifacts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  artifact_id  TEXT REFERENCES artifacts(id),
  obtained_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, artifact_id)
);

-- ── Notifications ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Leaderboard View ────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_legacy AS
SELECT
  p.id,
  p.username,
  p.avatar_url,
  p.legacy_score,
  p.map_discovery,
  p.archive_count,
  RANK() OVER (ORDER BY p.legacy_score DESC)    AS legacy_rank,
  RANK() OVER (ORDER BY p.map_discovery DESC)   AS discovery_rank,
  RANK() OVER (ORDER BY p.archive_count DESC)   AS archive_rank
FROM profiles p;

-- ── Row Level Security ──────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_captures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write+insert
CREATE POLICY "Public profiles visible"    ON profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- User data: own only
CREATE POLICY "Own districts"     ON user_districts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own captures"      ON user_captures  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own artifacts"     ON user_artifacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own notifications" ON notifications  FOR ALL USING (auth.uid() = user_id);

-- Public reads on catalogs
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE figures   ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public figures"   ON figures   FOR SELECT USING (true);
CREATE POLICY "Public artifacts" ON artifacts FOR SELECT USING (true);

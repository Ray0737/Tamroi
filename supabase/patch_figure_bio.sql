-- patch_figure_bio.sql
-- Adds biography detail fields + figure relations graph table.
-- Run after patch_coop.sql (needs figures table).

-- 1. Richer bio fields (era already exists from patch_era.sql)
ALTER TABLE figures ADD COLUMN IF NOT EXISTS bio_th     TEXT;
ALTER TABLE figures ADD COLUMN IF NOT EXISTS birth_year INTEGER;
ALTER TABLE figures ADD COLUMN IF NOT EXISTS death_year INTEGER;

-- 2. Relations (directed edges; client queries both directions)
CREATE TABLE IF NOT EXISTS figure_relations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id   TEXT NOT NULL REFERENCES figures(id) ON DELETE CASCADE,
  related_id  TEXT NOT NULL REFERENCES figures(id) ON DELETE CASCADE,
  relation_th TEXT NOT NULL,
  UNIQUE (figure_id, related_id)
);

ALTER TABLE figure_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read figure_relations"
  ON figure_relations FOR SELECT USING (true);

-- 3. Seed edges — WHERE EXISTS skips rows whose IDs aren't in this DB instance
INSERT INTO figure_relations (figure_id, related_id, relation_th)
SELECT a, b, r FROM (VALUES
  -- Ayutthaya royalty cluster
  ('fig-s-09', 'fig-s-10', 'ร่วมยุคอยุธยา'),
  -- Silom notables
  ('fig-b-06', 'fig-s-14', 'ร่วมยุคสมัยใหม่'),
  -- Rattanakosin literary figures
  ('fig-a-01', 'fig-b-04', 'นักวรรณกรรมพระนคร'),
  -- Rattanakosin communities
  ('fig-c-01', 'fig-c-02', 'ชาวพระนคร'),
  -- King Taksin connections
  ('fig-s-01', 'fig-c-01', 'ยุคต้นกรุงรัตนโกสินทร์'),
  ('fig-s-01', 'fig-b-04', 'ผู้บันทึกประวัติศาสตร์'),
  -- Canal trade network
  ('fig-c-08', 'fig-c-02', 'เส้นทางค้าคลอง'),
  -- Pathumwan intellectual cluster
  ('fig-a-03', 'fig-c-05', 'เพื่อนบ้านปทุมวัน')
) AS t(a, b, r)
WHERE EXISTS (SELECT 1 FROM figures WHERE id = t.a)
  AND EXISTS (SELECT 1 FROM figures WHERE id = t.b)
ON CONFLICT DO NOTHING;

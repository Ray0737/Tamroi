-- Figure cameo on lore chain completion:
-- lore_nodes.figure_id  → which figure appears when this chain completes
-- figures.quote_th      → the speech bubble line (null = no bubble)

ALTER TABLE figures
  ADD COLUMN IF NOT EXISTS quote_th TEXT;

ALTER TABLE lore_nodes
  ADD COLUMN IF NOT EXISTS figure_id TEXT REFERENCES figures(id);

-- patch_lore_coord_fix.sql
-- Fix lore-wat-pho-learning: lng was copied from rattanakosin watchtower (100.4930)
-- instead of Wat Pho's actual position. Matches node-rattanakosin-landmark-3 coords.
UPDATE lore_nodes
SET lat = 13.7459, lng = 100.4883
WHERE id = 'lore-wat-pho-learning';

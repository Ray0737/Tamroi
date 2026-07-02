-- patch_remove_rama_kings_fixed.sql
-- patch_remove_rama.sql and patch_remove_all_rama.sql targeted figure ids
-- 'rama-i'..'rama-ix', which never matched the live dataset — the real
-- King Rama I-IX rows use the fig-s-NN id scheme (confirmed live via
-- SELECT ... WHERE name_th ILIKE '%รัชกาล%'). Those two patches were no-ops
-- in production. This is the corrected version, safe to re-run.

DO $$
DECLARE
  rama_ids TEXT[] := ARRAY[
    'fig-s-02', -- Rama I
    'fig-s-08', -- Rama II
    'fig-s-06', -- Rama III
    'fig-s-07', -- Rama IV
    'fig-s-03', -- Rama V
    'fig-s-04', -- Rama VI
    'fig-s-11', -- Rama VII
    'fig-s-15', -- Rama VIII
    'fig-s-05'  -- Rama IX
  ];
  rid TEXT;
BEGIN
  FOREACH rid IN ARRAY rama_ids LOOP
    DELETE FROM raid_sessions      WHERE figure_id = rid;
    DELETE FROM figure_discussions WHERE figure_id = rid;
    DELETE FROM quiz_questions     WHERE figure_id = rid;
    DELETE FROM user_captures      WHERE figure_id = rid;
    DELETE FROM figures            WHERE id        = rid;
  END LOOP;
END $$;

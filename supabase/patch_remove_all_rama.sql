-- Remove all King Rama figures (II–IX) from all tables
-- rama-i was already removed in patch_remove_rama.sql

DO $$
DECLARE
  rama_ids TEXT[] := ARRAY['rama-ii','rama-iii','rama-iv','rama-v','rama-vi','rama-vii','rama-viii','rama-ix'];
  rid TEXT;
BEGIN
  FOREACH rid IN ARRAY rama_ids LOOP
    DELETE FROM raid_sessions         WHERE figure_id = rid;
    DELETE FROM figure_discussions    WHERE figure_id = rid;
    DELETE FROM quiz_questions        WHERE figure_id = rid;
    DELETE FROM user_captures         WHERE figure_id = rid;
    DELETE FROM figures               WHERE id        = rid;
  END LOOP;
END $$;

-- patch_fix_user_fk.sql
-- Re-point user_id FKs from auth.users → profiles(id) so PostgREST can resolve
-- profiles(username) embedded joins. All tables in schema.sql already use
-- profiles(id); these patch tables were incorrectly wired to auth.users.

ALTER TABLE community_posts
  DROP CONSTRAINT IF EXISTS community_posts_user_id_fkey,
  ADD CONSTRAINT community_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE figure_discussions
  DROP CONSTRAINT IF EXISTS figure_discussions_user_id_fkey,
  ADD CONSTRAINT figure_discussions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE discussion_flags
  DROP CONSTRAINT IF EXISTS discussion_flags_user_id_fkey,
  ADD CONSTRAINT discussion_flags_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE collab_mission_checkins
  DROP CONSTRAINT IF EXISTS collab_mission_checkins_user_id_fkey,
  ADD CONSTRAINT collab_mission_checkins_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE raid_session_members
  DROP CONSTRAINT IF EXISTS raid_session_members_user_id_fkey,
  ADD CONSTRAINT raid_session_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

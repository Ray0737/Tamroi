-- patch_fix_user_fk.sql
-- Fix community_posts and figure_discussions so PostgREST can resolve
-- profiles(username) join. Tables must reference profiles(id), not auth.users(id).

-- community_posts
ALTER TABLE community_posts
  DROP CONSTRAINT IF EXISTS community_posts_user_id_fkey;
ALTER TABLE community_posts
  ADD CONSTRAINT community_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- figure_discussions
ALTER TABLE figure_discussions
  DROP CONSTRAINT IF EXISTS figure_discussions_user_id_fkey;
ALTER TABLE figure_discussions
  ADD CONSTRAINT figure_discussions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- discussion_flags (also used in joins via figure_discussions)
ALTER TABLE discussion_flags
  DROP CONSTRAINT IF EXISTS discussion_flags_user_id_fkey;
ALTER TABLE discussion_flags
  ADD CONSTRAINT discussion_flags_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

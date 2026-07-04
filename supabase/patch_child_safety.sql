-- patch_child_safety.sql
-- Run after patch_community_likes.sql
-- Adds: (1) PDPA age/guardian consent record on profiles, (2) one-time
-- community guidelines acceptance record, (3) new-user post probation
-- (held until manually approved by an admin via the Supabase table editor,
-- or auto-approved on first like).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_consent_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guidelines_accepted_at TIMESTAMPTZ;

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN NOT NULL DEFAULT false;

-- New-user probation: accounts younger than 24h have their posts held.
CREATE OR REPLACE FUNCTION set_post_probation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.pending_approval := EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.user_id AND created_at > now() - interval '24 hours'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS community_posts_probation ON community_posts;
CREATE TRIGGER community_posts_probation
  BEFORE INSERT ON community_posts
  FOR EACH ROW EXECUTE FUNCTION set_post_probation();

-- Auto-approve a held post the moment it receives its first like.
CREATE OR REPLACE FUNCTION approve_post_on_first_like()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts SET pending_approval = false
  WHERE id = NEW.post_id AND pending_approval = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS community_post_likes_approve ON community_post_likes;
CREATE TRIGGER community_post_likes_approve
  AFTER INSERT ON community_post_likes
  FOR EACH ROW EXECUTE FUNCTION approve_post_on_first_like();

-- Held posts are only visible to their author until approved.
DROP POLICY IF EXISTS "community_posts_select" ON community_posts;
CREATE POLICY "community_posts_select" ON community_posts
  FOR SELECT USING (NOT pending_approval OR auth.uid() = user_id);

-- supabase/patch_coop_fix.sql

-- ── guild_join_requests ────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_join_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id   UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, user_id)
);
ALTER TABLE guild_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member can insert own request"
  ON guild_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member can read own request"
  ON guild_join_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "leader can read guild requests"
  ON guild_join_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM guild_members
    WHERE guild_members.guild_id = guild_join_requests.guild_id
      AND guild_members.user_id = auth.uid()
      AND guild_members.role = 'leader'
  ));

CREATE POLICY "leader can update guild requests"
  ON guild_join_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM guild_members
    WHERE guild_members.guild_id = guild_join_requests.guild_id
      AND guild_members.user_id = auth.uid()
      AND guild_members.role = 'leader'
  ));

-- ── community_posts ────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 500),
  parent_id  UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read community_posts"
  ON community_posts FOR SELECT USING (true);

CREATE POLICY "authenticated can insert own community_post"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── community_post_flags ───────────────────────────────
CREATE TABLE IF NOT EXISTS community_post_flags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, flagged_by)
);
ALTER TABLE community_post_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can flag"
  ON community_post_flags FOR INSERT
  WITH CHECK (auth.uid() = flagged_by);

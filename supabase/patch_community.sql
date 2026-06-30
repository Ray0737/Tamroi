-- patch_community.sql
-- Run in Supabase SQL Editor after patch_group_management.sql

CREATE TABLE IF NOT EXISTS community_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 500),
  parent_id  UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "community_posts_insert" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS community_post_flags (
  post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  flagged_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, flagged_by)
);

ALTER TABLE community_post_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_post_flags_insert" ON community_post_flags
  FOR INSERT WITH CHECK (auth.uid() = flagged_by);

CREATE INDEX IF NOT EXISTS community_posts_parent_idx ON community_posts(parent_id);
CREATE INDEX IF NOT EXISTS community_posts_created_idx ON community_posts(created_at DESC);

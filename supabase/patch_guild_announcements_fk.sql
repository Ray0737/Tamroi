-- patch_guild_announcements_fk.sql
-- The guild_announcements table exists live but was never committed to this
-- repo's SQL history, and its posted_by column had no FK to profiles(id) —
-- js/supabase-client.js's getAnnouncements() embeds profiles(username), which
-- PostgREST can only resolve through a real foreign key. Without it, every
-- read failed with "could not find relationship" even though writes worked.
ALTER TABLE guild_announcements
  DROP CONSTRAINT IF EXISTS guild_announcements_posted_by_fkey,
  ADD CONSTRAINT guild_announcements_posted_by_fkey
    FOREIGN KEY (posted_by) REFERENCES profiles(id) ON DELETE CASCADE;

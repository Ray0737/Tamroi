-- guild_jigsaw_assignments.user_id only had a foreign key to auth.users,
-- but js/supabase-client.js's getJigsawAssignments() embeds profiles
-- (username, avatar_url) for the merge-phase card. PostgREST can't
-- auto-resolve that embed without a direct FK between the two tables, so
-- every call to it has been throwing a 400 (PGRST200) since this feature
-- was built — coop.js's catch-all silently swallows it and renders "no
-- missions", making Jigsaw look absent instead of broken. profiles.id is
-- 1:1 with auth.users.id for every real user, so this is safe to add
-- alongside the existing auth.users FK.
ALTER TABLE guild_jigsaw_assignments
  ADD CONSTRAINT guild_jigsaw_assignments_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

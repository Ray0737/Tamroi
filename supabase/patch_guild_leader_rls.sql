-- Fix: join-request notifications never reached the guild leader.
-- guild_members_select RLS (patch_coop.sql) only lets a user see membership
-- rows for guilds they already belong to, so sendJoinRequest()'s leader
-- lookup returned zero rows for a non-member requester and the
-- notification insert was silently skipped.
-- Allow anyone authenticated to see who a guild's leader is (not the full roster).

DROP POLICY IF EXISTS "guild_members_select_leader" ON guild_members;
CREATE POLICY "guild_members_select_leader" ON guild_members
  FOR SELECT USING (role = 'leader');

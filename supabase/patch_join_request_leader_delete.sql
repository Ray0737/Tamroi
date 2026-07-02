-- patch_join_request_leader_delete.sql
-- patch_coop_fix.sql only added a DELETE policy for the requester
-- themselves ("member can delete own request"). There was no policy
-- letting a guild leader delete someone else's request row, so
-- DB.Coop.approveRequest()/rejectRequest() silently deleted 0 rows
-- when called by the leader (Supabase RLS filters the row out without
-- raising an error) — the member got added to guild_members but the
-- request stayed stuck as "pending" forever.
CREATE POLICY "leader can delete guild requests"
  ON guild_join_requests FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM guild_members
    WHERE guild_members.guild_id = guild_join_requests.guild_id
      AND guild_members.user_id = auth.uid()
      AND guild_members.role = 'leader'
  ));

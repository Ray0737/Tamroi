-- Fix: join-request notifications had no way to link back to the
-- guild_join_requests row, so the notification tab could only show
-- text — no Accept/Ignore action for the guild leader.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ref_id UUID;

-- Fix: split "Own notifications" FOR ALL policy so authenticated users
-- can INSERT notifications for other users (e.g. notify guild leader of join request).
-- SELECT/UPDATE/DELETE remain restricted to own rows.

DROP POLICY IF EXISTS "Own notifications" ON notifications;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- patch_auth_fix.sql
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- Fixes: trigger crash, missing INSERT policy, robust username
-- ============================================================

-- ── 1. Fix the trigger: handle duplicates + never crash signup ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_uname  TEXT;
  final_uname TEXT;
  counter     INT := 0;
BEGIN
  -- Build a base username from Google name, metadata, or email prefix
  base_uname := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1),
    split_part(NEW.email, '@', 1)
  );

  -- Sanitize: strip non-alphanumeric except underscore, lowercase, max 20 chars
  base_uname := lower(regexp_replace(base_uname, '[^a-zA-Z0-9_]', '', 'g'));
  base_uname := left(NULLIF(base_uname, ''), 20);
  IF base_uname IS NULL OR base_uname = '' THEN
    base_uname := 'traveler';
  END IF;

  final_uname := base_uname;

  -- Append a counter until the username is unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_uname) LOOP
    counter     := counter + 1;
    final_uname := base_uname || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    final_uname,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent: skip if already exists

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Never block a signup because profile creation failed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create trigger (DROP first so it doesn't conflict)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 2. Add missing INSERT + SELECT policies for profiles ───────
-- (Without INSERT policy, getOrCreate upsert is blocked by RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users insert own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users insert own profile"
             ON public.profiles FOR INSERT
             WITH CHECK (auth.uid() = id)';
  END IF;
END $$;


-- ── 3. Verify tables exist (run schema.sql first if these fail) ─
-- If you see "relation does not exist", run supabase/schema.sql first.
SELECT 'profiles table OK'   FROM public.profiles   LIMIT 0;
SELECT 'districts table OK'  FROM public.districts  LIMIT 0;
SELECT 'figures table OK'    FROM public.figures     LIMIT 0;

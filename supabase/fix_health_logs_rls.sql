-- Fix health_logs table: remove FK constraint causing hanging inserts,
-- and drop/recreate RLS policies cleanly.
-- Run this in your Supabase SQL editor.

-- Step 1: Drop the FK constraint (health_logs doesn't need to reference profiles)
ALTER TABLE public.health_logs
  DROP CONSTRAINT IF EXISTS health_logs_user_id_fkey;

-- Step 2: Make user_id just a plain uuid (no FK)
-- (column type stays the same, just no foreign key reference)

-- Step 3: Drop all existing policies on health_logs and recreate cleanly
DROP POLICY IF EXISTS "Patients can view own logs" ON public.health_logs;
DROP POLICY IF EXISTS "Patients can insert own logs" ON public.health_logs;
DROP POLICY IF EXISTS "Patients can update own logs" ON public.health_logs;

-- Step 4: Recreate with clean policies
CREATE POLICY "Patients can view own logs" ON public.health_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own logs" ON public.health_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can update own logs" ON public.health_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 5: Also ensure profiles has proper upsert support (INSERT + UPDATE)
DROP POLICY IF EXISTS "Patients can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Patients can update own profile" ON public.profiles;

CREATE POLICY "Patients can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Patients can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Verify: check your policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

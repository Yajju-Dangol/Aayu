-- Add health_logs table for AI-driven structured logging
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.health_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_type text NOT NULL, -- 'blood_pressure', 'medicine', 'mood', 'symptom'
    data jsonb DEFAULT '{}'::jsonb,
    logged_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_logs_user_time_idx ON public.health_logs (user_id, logged_at DESC);

-- Enable RLS
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view own logs" ON public.health_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own logs" ON public.health_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role (used by Edge Functions and Supabase anon key with RLS bypass) to insert
-- Needed because the AI agent calls supabase with the anon key from the browser as the authenticated user
CREATE POLICY "Patients can update own logs" ON public.health_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_logs;

-- Also add RLS insert policy for health_knowledge (needed for PDF upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'health_knowledge'
      AND policyname = 'Patients can insert own knowledge'
  ) THEN
    EXECUTE 'CREATE POLICY "Patients can insert own knowledge" ON public.health_knowledge
      FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END;
$$;


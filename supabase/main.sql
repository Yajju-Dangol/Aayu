-- 🏗️ Aayu Database Schema (Consolidated)
-- This file combines all initialization, tables, and security policies.

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA public;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- A. Core User & Identity
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    emergency_contact text,
    health_summary text,
    blood_type text
);

-- B. Structured Health Metrics
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_type text NOT NULL, -- e.g., 'bp_systolic', 'session_analysis', etc.
    value float, -- Made nullable to support structured JSON analysis
    details jsonb DEFAULT '{}'::jsonb, -- New column for detailed AI analysis
    recorded_at timestamptz DEFAULT now()
);

-- C. Knowledge Base (Vector Store)
CREATE TABLE IF NOT EXISTS public.health_knowledge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- D. Medication & Reminders
CREATE TABLE IF NOT EXISTS public.medications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    dosage text,
    frequency text,
    reminder_times time[] DEFAULT '{}'
);

-- E. AI Health Logs (Dynamic Logging)
CREATE TABLE IF NOT EXISTS public.health_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid, -- No hard FK to avoid hanging inserts during rapid streaming
    log_type text NOT NULL, -- 'blood_pressure', 'medicine', 'mood', 'symptom'
    data jsonb DEFAULT '{}'::jsonb,
    logged_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS health_metrics_user_time_idx ON public.health_metrics (user_id, recorded_at);
CREATE INDEX IF NOT EXISTS health_logs_user_time_idx ON public.health_logs (user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS health_knowledge_embedding_idx ON public.health_knowledge USING hnsw (embedding vector_cosine_ops);

-- ==========================================
-- 4. SECURITY (RLS)
-- ==========================================

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean state
DROP POLICY IF EXISTS "Patients can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Patients can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Patients can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Patients can view own metrics" ON public.health_metrics;
DROP POLICY IF EXISTS "Patients can insert own metrics" ON public.health_metrics;
DROP POLICY IF EXISTS "Patients can view own knowledge" ON public.health_knowledge;
DROP POLICY IF EXISTS "Patients can insert own knowledge" ON public.health_knowledge;
DROP POLICY IF EXISTS "Patients can view own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can view own logs" ON public.health_logs;
DROP POLICY IF EXISTS "Patients can insert own logs" ON public.health_logs;
DROP POLICY IF EXISTS "Patients can update own logs" ON public.health_logs;

-- Recreate Policies
CREATE POLICY "Patients can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Patients can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Patients can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patients can view own metrics" ON public.health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own metrics" ON public.health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can view own knowledge" ON public.health_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own knowledge" ON public.health_knowledge FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can view own medications" ON public.medications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can view own logs" ON public.health_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own logs" ON public.health_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Patients can update own logs" ON public.health_logs FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 5. FUNCTIONS & TRIGGERS
-- ==========================================

-- Red Flag Detection for High Blood Pressure
CREATE OR REPLACE FUNCTION check_high_bp() 
RETURNS trigger AS $$
BEGIN
  IF NEW.metric_type = 'bp_systolic' AND NEW.value > 160 THEN
    PERFORM net.http_post(
      url := 'https://your-edge-fn.supabase.co/functions/v1/alert-caretaker',
      body := jsonb_build_object('user_id', NEW.user_id, 'metric_type', NEW.metric_type, 'value', NEW.value)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_high_bp ON public.health_metrics;
CREATE TRIGGER trigger_check_high_bp
AFTER INSERT ON public.health_metrics
FOR EACH ROW
EXECUTE FUNCTION check_high_bp();

-- Vector Search RPC
CREATE OR REPLACE FUNCTION public.match_health_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    health_knowledge.id,
    health_knowledge.content,
    health_knowledge.metadata,
    1 - (health_knowledge.embedding <=> query_embedding) AS similarity
  FROM health_knowledge
  WHERE health_knowledge.user_id = p_user_id
    AND 1 - (health_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY health_knowledge.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ==========================================
-- 6. REAL-TIME & CRON
-- ==========================================

-- Set up Real-time Subscription
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_logs;

-- pg_cron task (Morning medication check)
-- Note: Requires pg_cron to be active in the dashboard
SELECT cron.schedule(
    'morning-checkin',
    '0 8 * * *', 
    $$
    SELECT net.http_post(
      url := 'https://your-edge-fn.supabase.co/functions/v1/morning-call-trigger'
    );
    $$
);

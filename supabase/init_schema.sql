-- 🏗️ 1. Database Schema Blueprint

-- Initialize Extensions
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA public;

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
    metric_type text NOT NULL, -- e.g., 'bp_systolic', 'bp_diastolic', 'blood_sugar', 'weight', 'heart_rate'
    value float NOT NULL,
    recorded_at timestamptz DEFAULT now()
);

-- Index for fast dashboard loading
CREATE INDEX IF NOT EXISTS health_metrics_user_time_idx ON public.health_metrics (user_id, recorded_at);

-- Set up Real-time Subscription capability on health_metrics
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_metrics;

-- C. Knowledge Base (Vector Store)
CREATE TABLE IF NOT EXISTS public.health_knowledge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- HNSW Index for sub-second vector retrieval
CREATE INDEX IF NOT EXISTS health_knowledge_embedding_idx ON public.health_knowledge USING hnsw (embedding vector_cosine_ops);

-- D. Medication & Reminders
CREATE TABLE IF NOT EXISTS public.medications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    dosage text,
    frequency text,
    reminder_times time[] DEFAULT '{}'
);

-- 🛠️ 2. Critical Database Features

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Patient Policies: Patients can only SELECT and INSERT their own data
CREATE POLICY "Patients can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Patients can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Patients can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patients can view own metrics" ON public.health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own metrics" ON public.health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can view own knowledge" ON public.health_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can view own medications" ON public.medications FOR SELECT USING (auth.uid() = user_id);

-- Automated Triggers (Database Functions)
-- Red Flag Detection for High Blood Pressure
CREATE OR REPLACE FUNCTION check_high_bp() 
RETURNS trigger AS $$
BEGIN
  IF NEW.metric_type = 'bp_systolic' AND NEW.value > 160 THEN
    -- This triggers a Supabase Edge Function to send a WhatsApp alert
    -- Replace 'https://your-edge-fn.supabase.co/functions/v1/alert-caretaker' with actual URL when deployed
    PERFORM net.http_post(
      url := 'https://your-edge-fn.supabase.co/functions/v1/alert-caretaker',
      body := jsonb_build_object('user_id', NEW.user_id, 'metric_type', NEW.metric_type, 'value', NEW.value)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_high_bp
AFTER INSERT ON public.health_metrics
FOR EACH ROW
EXECUTE FUNCTION check_high_bp();

-- 📈 3. Implementation Checklist Triggers
-- Setup pg_cron task to run every morning at 8:00 AM (Checks medications)
-- (Note: pg_cron execution context must be configured in supabase dashboard)
SELECT cron.schedule(
    'morning-checkin',
    '0 8 * * *', 
    $$
    -- Logic to trigger the "Good Morning" AI call via Edge Function
    SELECT net.http_post(
      url := 'https://your-edge-fn.supabase.co/functions/v1/morning-call-trigger'
    );
    $$
);

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

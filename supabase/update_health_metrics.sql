-- Run this in your Supabase SQL editor to support the new structured JSON metrics
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.health_metrics ALTER COLUMN value DROP NOT NULL;

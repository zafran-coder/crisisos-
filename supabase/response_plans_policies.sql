-- CrisisOS Phase 5 — Response Plans & Allocations RLS Policies
-- Target: Remote Supabase PostgreSQL
-- Purpose: Grants INSERT & SELECT permissions on response_plans and response_allocations
--          so server API routes can persist generated tactical plans without disabling RLS.

ALTER TABLE IF EXISTS response_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS response_allocations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 1. Response Plans SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'response_plans' AND policyname = 'Allow public select response_plans'
  ) THEN
    CREATE POLICY "Allow public select response_plans" ON response_plans FOR SELECT USING (true);
  END IF;

  -- 2. Response Plans INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'response_plans' AND policyname = 'Allow public insert response_plans'
  ) THEN
    CREATE POLICY "Allow public insert response_plans" ON response_plans FOR INSERT WITH CHECK (true);
  END IF;

  -- 3. Response Allocations SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'response_allocations' AND policyname = 'Allow public select response_allocations'
  ) THEN
    CREATE POLICY "Allow public select response_allocations" ON response_allocations FOR SELECT USING (true);
  END IF;

  -- 4. Response Allocations INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'response_allocations' AND policyname = 'Allow public insert response_allocations'
  ) THEN
    CREATE POLICY "Allow public insert response_allocations" ON response_allocations FOR INSERT WITH CHECK (true);
  END IF;
END $$;

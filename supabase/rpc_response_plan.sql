-- CrisisOS Phase 5 & 6 — Secure RPC Persistence & Resource Allocation Migration
-- Target: Remote Supabase PostgreSQL
-- Security: SECURITY DEFINER functions with fixed search_path = public.
--           RLS remains ENABLED on all operational tables.
--           Zero public "WITH CHECK (true)" insert policies.
--           Zero service-role key required for client application route handlers.

-- =============================================================================
-- 1. Ensure Target Tables Have RLS Enabled (Non-Destructive)
-- =============================================================================
ALTER TABLE IF EXISTS response_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS response_allocations ENABLE ROW LEVEL SECURITY;

-- Ensure public SELECT policies exist so anon clients can read persisted plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'response_plans' AND policyname = 'Allow select response_plans'
  ) THEN
    CREATE POLICY "Allow select response_plans" ON response_plans FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'response_allocations' AND policyname = 'Allow select response_allocations'
  ) THEN
    CREATE POLICY "Allow select response_allocations" ON response_allocations FOR SELECT USING (true);
  END IF;
END $$;

-- =============================================================================
-- 2. Optional: Emergency Inventory Table for SIMULATED DEMO INVENTORY
-- =============================================================================
CREATE TABLE IF NOT EXISTS emergency_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL UNIQUE,
  total_available INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS emergency_inventory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'emergency_inventory' AND policyname = 'Allow select emergency_inventory'
  ) THEN
    CREATE POLICY "Allow select emergency_inventory" ON emergency_inventory FOR SELECT USING (true);
  END IF;
END $$;

-- Seed canonical demo inventory linked to canonical incident
DO $$
DECLARE
  v_incident_id UUID;
BEGIN
  SELECT id INTO v_incident_id FROM incidents WHERE status = 'ACTIVE' LIMIT 1;
  IF v_incident_id IS NOT NULL THEN
    INSERT INTO emergency_inventory (incident_id, resource_type, total_available, status)
    VALUES
      (v_incident_id, 'RESCUE_TEAMS', 18, 'AVAILABLE'),
      (v_incident_id, 'RESCUE_BOATS', 12, 'AVAILABLE'),
      (v_incident_id, 'AMBULANCES', 10, 'AVAILABLE'),
      (v_incident_id, 'MEDICAL_UNITS', 8, 'AVAILABLE'),
      (v_incident_id, 'WATER_UNITS', 6, 'AVAILABLE')
    ON CONFLICT (resource_type) DO UPDATE
    SET
      incident_id = v_incident_id,
      total_available = EXCLUDED.total_available,
      status = EXCLUDED.status,
      updated_at = NOW();
  END IF;
END $$;

-- =============================================================================
-- 3. Restricted SECURITY DEFINER Function: create_operational_response_plan
-- =============================================================================
-- Accepts only exact required parameters, validates incident/zone existence,
-- inserts into response_plans and response_allocations, and returns plan_id.
CREATE OR REPLACE FUNCTION create_operational_response_plan(
  p_incident_id UUID,
  p_title TEXT,
  p_summary TEXT,
  p_status TEXT,
  p_allocations JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_id UUID;
  v_count INT := 0;
  v_elem JSONB;
  v_zone_id UUID;
  v_rescue INT;
  v_med INT;
  v_boat INT;
  v_amb INT;
  v_water INT;
  v_total INT;
BEGIN
  -- 1. Validation: Incident must exist
  IF p_incident_id IS NULL OR NOT EXISTS (SELECT 1 FROM incidents WHERE id = p_incident_id) THEN
    -- Fallback to active incident if id was unspecified
    SELECT id INTO p_incident_id FROM incidents WHERE status = 'ACTIVE' LIMIT 1;
    IF p_incident_id IS NULL THEN
      RAISE EXCEPTION 'No active incident found for response plan.';
    END IF;
  END IF;

  -- 2. Validate required title and summary
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Plan title cannot be empty.';
  END IF;

  IF p_summary IS NULL OR length(trim(p_summary)) = 0 THEN
    RAISE EXCEPTION 'Plan summary cannot be empty.';
  END IF;

  -- 3. Insert response plan record
  v_plan_id := gen_random_uuid();
  INSERT INTO response_plans (
    id,
    incident_id,
    title,
    summary,
    status,
    created_at
  ) VALUES (
    v_plan_id,
    p_incident_id,
    trim(p_title),
    trim(p_summary),
    COALESCE(NULLIF(trim(p_status), ''), 'ACTIVE'),
    NOW()
  );

  -- 4. Process allocations if supplied
  IF p_allocations IS NOT NULL AND jsonb_typeof(p_allocations) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_zone_id := (v_elem->>'zone_id')::UUID;
      
      -- Verify zone exists in database
      IF v_zone_id IS NOT NULL AND EXISTS (SELECT 1 FROM affected_zones WHERE id = v_zone_id) THEN
        v_rescue := GREATEST(0, LEAST(50, COALESCE((v_elem->>'rescue_teams')::INT, 0)));
        v_med    := GREATEST(0, LEAST(50, COALESCE((v_elem->>'medical_units')::INT, 0)));
        v_boat   := GREATEST(0, LEAST(50, COALESCE((v_elem->>'boats')::INT, 0)));
        v_amb    := GREATEST(0, LEAST(50, COALESCE((v_elem->>'ambulances')::INT, 0)));
        v_water  := GREATEST(0, LEAST(50, COALESCE((v_elem->>'water_units')::INT, 0)));
        v_total  := v_rescue + v_med + v_boat + v_amb + v_water;

        INSERT INTO response_allocations (
          id,
          response_plan_id,
          zone_id,
          rescue_teams,
          medical_units,
          boats,
          ambulances,
          water_units,
          count,
          created_at
        ) VALUES (
          gen_random_uuid(),
          v_plan_id,
          v_zone_id,
          v_rescue,
          v_med,
          v_boat,
          v_amb,
          v_water,
          v_total,
          NOW()
        );

        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'plan_id', v_plan_id,
    'allocations_count', v_count
  );
END;
$$;

-- Grant EXECUTE to public anon and authenticated roles
REVOKE ALL ON FUNCTION create_operational_response_plan(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_operational_response_plan(UUID, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

-- =============================================================================
-- 4. Restricted SECURITY DEFINER Function: save_zone_allocations
-- =============================================================================
-- Replaces or writes allocation rows for a given plan without duplicating records.
CREATE OR REPLACE FUNCTION save_zone_allocations(
  p_plan_id UUID,
  p_allocations JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
  v_elem JSONB;
  v_zone_id UUID;
  v_rescue INT;
  v_med INT;
  v_boat INT;
  v_amb INT;
  v_water INT;
  v_total INT;
BEGIN
  IF p_plan_id IS NULL OR NOT EXISTS (SELECT 1 FROM response_plans WHERE id = p_plan_id) THEN
    RAISE EXCEPTION 'Target response plan % does not exist.', p_plan_id;
  END IF;

  -- Delete existing allocations for this plan to prevent duplicates
  DELETE FROM response_allocations WHERE response_plan_id = p_plan_id;

  IF p_allocations IS NOT NULL AND jsonb_typeof(p_allocations) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      v_zone_id := (v_elem->>'zone_id')::UUID;
      
      IF v_zone_id IS NOT NULL AND EXISTS (SELECT 1 FROM affected_zones WHERE id = v_zone_id) THEN
        v_rescue := GREATEST(0, LEAST(50, COALESCE((v_elem->>'rescue_teams')::INT, 0)));
        v_med    := GREATEST(0, LEAST(50, COALESCE((v_elem->>'medical_units')::INT, 0)));
        v_boat   := GREATEST(0, LEAST(50, COALESCE((v_elem->>'boats')::INT, 0)));
        v_amb    := GREATEST(0, LEAST(50, COALESCE((v_elem->>'ambulances')::INT, 0)));
        v_water  := GREATEST(0, LEAST(50, COALESCE((v_elem->>'water_units')::INT, 0)));
        v_total  := v_rescue + v_med + v_boat + v_amb + v_water;

        INSERT INTO response_allocations (
          id,
          response_plan_id,
          zone_id,
          rescue_teams,
          medical_units,
          boats,
          ambulances,
          water_units,
          count,
          created_at
        ) VALUES (
          gen_random_uuid(),
          p_plan_id,
          v_zone_id,
          v_rescue,
          v_med,
          v_boat,
          v_amb,
          v_water,
          v_total,
          NOW()
        );

        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'plan_id', p_plan_id,
    'allocations_count', v_count
  );
END;
$$;

-- Grant EXECUTE to public anon and authenticated roles
REVOKE ALL ON FUNCTION save_zone_allocations(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_zone_allocations(UUID, JSONB) TO anon, authenticated;

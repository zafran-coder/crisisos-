-- CrisisOS Phase 7 — Evidence and Audit Trail Migration
-- Target: Remote Supabase PostgreSQL
-- Security: RLS remains ENABLED. Restricted SECURITY DEFINER RPC function with fixed search_path.

-- =============================================================================
-- 1. Create audit_logs Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES affected_zones(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_incident ON audit_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- =============================================================================
-- 2. Enable Row Level Security (RLS)
-- =============================================================================
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow select audit_logs'
  ) THEN
    CREATE POLICY "Allow select audit_logs" ON audit_logs FOR SELECT USING (true);
  END IF;
END $$;

-- =============================================================================
-- 3. Restricted SECURITY DEFINER RPC: record_audit_event
-- =============================================================================
CREATE OR REPLACE FUNCTION record_audit_event(
  p_incident_id UUID,
  p_zone_id UUID,
  p_event_type TEXT,
  p_event_name TEXT,
  p_description TEXT,
  p_source TEXT,
  p_metadata JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validate required fields
  IF p_event_type IS NULL OR length(trim(p_event_type)) = 0 THEN
    RAISE EXCEPTION 'Event type cannot be empty.';
  END IF;

  IF p_event_name IS NULL OR length(trim(p_event_name)) = 0 THEN
    RAISE EXCEPTION 'Event name cannot be empty.';
  END IF;

  IF p_description IS NULL OR length(trim(p_description)) = 0 THEN
    RAISE EXCEPTION 'Event description cannot be empty.';
  END IF;

  -- Fallback incident if null
  IF p_incident_id IS NULL THEN
    SELECT id INTO p_incident_id FROM incidents WHERE status = 'ACTIVE' LIMIT 1;
  END IF;

  v_id := gen_random_uuid();
  INSERT INTO audit_logs (
    id,
    incident_id,
    zone_id,
    event_type,
    event_name,
    description,
    source,
    metadata,
    created_at
  ) VALUES (
    v_id,
    p_incident_id,
    p_zone_id,
    trim(p_event_type),
    trim(p_event_name),
    trim(p_description),
    COALESCE(NULLIF(trim(p_source), ''), 'SYSTEM'),
    COALESCE(p_metadata, '{}'::jsonb),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_id
  );
END;
$$;

-- Grant EXECUTE to public anon and authenticated roles
REVOKE ALL ON FUNCTION record_audit_event(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_audit_event(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

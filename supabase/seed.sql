-- CrisisOS Canonical Demo Seed
-- Target: Remote Supabase PostgreSQL Database
-- Scenario: Pakistan Flood Emergency - 2026 (Delta Basin Emergency Sector)
-- Schema Matched: public.incidents, public.affected_zones, public.risk_analyses
-- Idempotent & Non-Destructive: Safe to run multiple times without duplicating data.

DO $$
DECLARE
  v_incident_id UUID;
  v_zone_f03_id UUID;
  v_zone_b02_id UUID;
  v_zone_c05_id UUID;
  v_zone_a01_id UUID;
  v_zone_d04_id UUID;
  
  -- Verified: 'ACTIVE' is accepted by the affected_zones_status_check constraint
  v_zone_status CONSTANT TEXT := 'ACTIVE';
BEGIN

  -- 2. Insert or Update Canonical Incident
  -- NOT NULL columns satisfied: name, disaster_type, status, location_name, severity
  SELECT id INTO v_incident_id 
  FROM incidents 
  WHERE name = 'Pakistan Flood Emergency - 2026' 
  LIMIT 1;

  IF v_incident_id IS NULL THEN
    INSERT INTO incidents (
      name,
      disaster_type,
      status,
      location_name,
      severity,
      started_at
    )
    VALUES (
      'Pakistan Flood Emergency - 2026',
      'FLOOD',
      'ACTIVE',
      'Delta Basin Emergency Sector',
      'CRITICAL',
      NOW()
    )
    RETURNING id INTO v_incident_id;
  ELSE
    UPDATE incidents
    SET
      disaster_type = 'FLOOD',
      status = 'ACTIVE',
      location_name = 'Delta Basin Emergency Sector',
      severity = 'CRITICAL'
    WHERE id = v_incident_id;
  END IF;

  -- 3. Zone F-03 (Delta Basin)
  -- Rawalpindi Confluence: 33.5930 N, 73.0450 E
  -- Total Pop: 12,500 | Directly Affected Pop: 8,420 | Risk: 92 | Rank: 1
  SELECT id INTO v_zone_f03_id 
  FROM affected_zones 
  WHERE zone_code = 'F-03' 
  LIMIT 1;

  IF v_zone_f03_id IS NULL THEN
    INSERT INTO affected_zones (
      incident_id,
      zone_code,
      zone_name,
      population,
      affected_population,
      risk_score,
      priority_rank,
      severity,
      accessibility,
      medical_need,
      infrastructure_damage,
      status,
      latitude,
      longitude
    ) VALUES (
      v_incident_id,
      'F-03',
      'Delta Basin',
      12500,
      8420,
      92,
      1,
      'CATASTROPHIC',
      'VERY DIFFICULT',
      'CRITICAL',
      'CRITICAL',
      v_zone_status,
      33.5930,
      73.0450
    ) RETURNING id INTO v_zone_f03_id;
  ELSE
    UPDATE affected_zones
    SET
      incident_id = v_incident_id,
      zone_name = 'Delta Basin',
      population = 12500,
      affected_population = 8420,
      risk_score = 92,
      priority_rank = 1,
      severity = 'CATASTROPHIC',
      accessibility = 'VERY DIFFICULT',
      medical_need = 'CRITICAL',
      infrastructure_damage = 'CRITICAL',
      status = v_zone_status,
      latitude = 33.5930,
      longitude = 73.0450
    WHERE id = v_zone_f03_id;
  END IF;

  -- Factor verification: 95*0.30 + 92*0.25 + 90*0.20 + 90*0.15 + 90*0.10 = 28.5 + 23.0 + 18.0 + 13.5 + 9.0 = 92.0
  IF NOT EXISTS (SELECT 1 FROM risk_analyses WHERE zone_id = v_zone_f03_id) THEN
    INSERT INTO risk_analyses (
      zone_id,
      population_score,
      severity_score,
      medical_score,
      accessibility_score,
      infrastructure_score
    ) VALUES (
      v_zone_f03_id,
      95,
      92,
      90,
      90,
      90
    );
  ELSE
    UPDATE risk_analyses
    SET
      population_score = 95,
      severity_score = 92,
      medical_score = 90,
      accessibility_score = 90,
      infrastructure_score = 90
    WHERE zone_id = v_zone_f03_id;
  END IF;

  -- 4. Zone B-02 (River Bend)
  -- Soan Meander Corridor: 33.5780 N, 73.0620 E
  -- Total Pop: 9,800 | Directly Affected Pop: 5,760 | Risk: 84 | Rank: 2
  SELECT id INTO v_zone_b02_id 
  FROM affected_zones 
  WHERE zone_code = 'B-02' 
  LIMIT 1;

  IF v_zone_b02_id IS NULL THEN
    INSERT INTO affected_zones (
      incident_id,
      zone_code,
      zone_name,
      population,
      affected_population,
      risk_score,
      priority_rank,
      severity,
      accessibility,
      medical_need,
      infrastructure_damage,
      status,
      latitude,
      longitude
    ) VALUES (
      v_incident_id,
      'B-02',
      'River Bend',
      9800,
      5760,
      84,
      2,
      'SEVERE',
      'DIFFICULT',
      'HIGH',
      'HIGH',
      v_zone_status,
      33.5780,
      73.0620
    ) RETURNING id INTO v_zone_b02_id;
  ELSE
    UPDATE affected_zones
    SET
      incident_id = v_incident_id,
      zone_name = 'River Bend',
      population = 9800,
      affected_population = 5760,
      risk_score = 84,
      priority_rank = 2,
      severity = 'SEVERE',
      accessibility = 'DIFFICULT',
      medical_need = 'HIGH',
      infrastructure_damage = 'HIGH',
      status = v_zone_status,
      latitude = 33.5780,
      longitude = 73.0620
    WHERE id = v_zone_b02_id;
  END IF;

  -- Factor verification: 85*0.30 + 88*0.25 + 85*0.20 + 80*0.15 + 75*0.10 = 25.5 + 22.0 + 17.0 + 12.0 + 7.5 = 84.0
  IF NOT EXISTS (SELECT 1 FROM risk_analyses WHERE zone_id = v_zone_b02_id) THEN
    INSERT INTO risk_analyses (
      zone_id,
      population_score,
      severity_score,
      medical_score,
      accessibility_score,
      infrastructure_score
    ) VALUES (
      v_zone_b02_id,
      85,
      88,
      85,
      80,
      75
    );
  ELSE
    UPDATE risk_analyses
    SET
      population_score = 85,
      severity_score = 88,
      medical_score = 85,
      accessibility_score = 80,
      infrastructure_score = 75
    WHERE zone_id = v_zone_b02_id;
  END IF;

  -- 5. Zone C-05 (East Heights)
  -- Eastern Ridge / Midtown: 33.6120 N, 73.0750 E
  -- Total Pop: 18,500 | Directly Affected Pop: 11,780 | Risk: 73 | Rank: 3
  SELECT id INTO v_zone_c05_id 
  FROM affected_zones 
  WHERE zone_code = 'C-05' 
  LIMIT 1;

  IF v_zone_c05_id IS NULL THEN
    INSERT INTO affected_zones (
      incident_id,
      zone_code,
      zone_name,
      population,
      affected_population,
      risk_score,
      priority_rank,
      severity,
      accessibility,
      medical_need,
      infrastructure_damage,
      status,
      latitude,
      longitude
    ) VALUES (
      v_incident_id,
      'C-05',
      'East Heights',
      18500,
      11780,
      73,
      3,
      'SEVERE',
      'LIMITED',
      'HIGH',
      'MODERATE',
      v_zone_status,
      33.6120,
      73.0750
    ) RETURNING id INTO v_zone_c05_id;
  ELSE
    UPDATE affected_zones
    SET
      incident_id = v_incident_id,
      zone_name = 'East Heights',
      population = 18500,
      affected_population = 11780,
      risk_score = 73,
      priority_rank = 3,
      severity = 'SEVERE',
      accessibility = 'LIMITED',
      medical_need = 'HIGH',
      infrastructure_damage = 'MODERATE',
      status = v_zone_status,
      latitude = 33.6120,
      longitude = 73.0750
    WHERE id = v_zone_c05_id;
  END IF;

  -- Factor verification: 70*0.30 + 76*0.25 + 75*0.20 + 70*0.15 + 75*0.10 = 21.0 + 19.0 + 15.0 + 10.5 + 7.5 = 73.0
  IF NOT EXISTS (SELECT 1 FROM risk_analyses WHERE zone_id = v_zone_c05_id) THEN
    INSERT INTO risk_analyses (
      zone_id,
      population_score,
      severity_score,
      medical_score,
      accessibility_score,
      infrastructure_score
    ) VALUES (
      v_zone_c05_id,
      70,
      76,
      75,
      70,
      75
    );
  ELSE
    UPDATE risk_analyses
    SET
      population_score = 70,
      severity_score = 76,
      medical_score = 75,
      accessibility_score = 70,
      infrastructure_score = 75
    WHERE zone_id = v_zone_c05_id;
  END IF;

  -- 6. Zone A-01 (North Sector)
  -- Northern Residential District: 33.6300 N, 73.0400 E
  -- Total Pop: 14,200 | Directly Affected Pop: 9,150 | Risk: 61 | Rank: 4
  SELECT id INTO v_zone_a01_id 
  FROM affected_zones 
  WHERE zone_code = 'A-01' 
  LIMIT 1;

  IF v_zone_a01_id IS NULL THEN
    INSERT INTO affected_zones (
      incident_id,
      zone_code,
      zone_name,
      population,
      affected_population,
      risk_score,
      priority_rank,
      severity,
      accessibility,
      medical_need,
      infrastructure_damage,
      status,
      latitude,
      longitude
    ) VALUES (
      v_incident_id,
      'A-01',
      'North Sector',
      14200,
      9150,
      61,
      4,
      'MODERATE',
      'OPEN',
      'MODERATE',
      'MODERATE',
      v_zone_status,
      33.6300,
      73.0400
    ) RETURNING id INTO v_zone_a01_id;
  ELSE
    UPDATE affected_zones
    SET
      incident_id = v_incident_id,
      zone_name = 'North Sector',
      population = 14200,
      affected_population = 9150,
      risk_score = 61,
      priority_rank = 4,
      severity = 'MODERATE',
      accessibility = 'OPEN',
      medical_need = 'MODERATE',
      infrastructure_damage = 'MODERATE',
      status = v_zone_status,
      latitude = 33.6300,
      longitude = 73.0400
    WHERE id = v_zone_a01_id;
  END IF;

  -- Factor verification: 60*0.30 + 64*0.25 + 65*0.20 + 50*0.15 + 65*0.10 = 18.0 + 16.0 + 13.0 + 7.5 + 6.5 = 61.0
  IF NOT EXISTS (SELECT 1 FROM risk_analyses WHERE zone_id = v_zone_a01_id) THEN
    INSERT INTO risk_analyses (
      zone_id,
      population_score,
      severity_score,
      medical_score,
      accessibility_score,
      infrastructure_score
    ) VALUES (
      v_zone_a01_id,
      60,
      64,
      65,
      50,
      65
    );
  ELSE
    UPDATE risk_analyses
    SET
      population_score = 60,
      severity_score = 64,
      medical_score = 65,
      accessibility_score = 50,
      infrastructure_score = 65
    WHERE zone_id = v_zone_a01_id;
  END IF;

  -- 7. Zone D-04 (West Evac)
  -- Western High Plateau: 33.5650 N, 73.0150 E
  -- Total Pop: 6,500 | Directly Affected / Processed Pop: 4,120 | Risk: 34 | Rank: 5
  SELECT id INTO v_zone_d04_id 
  FROM affected_zones 
  WHERE zone_code = 'D-04' 
  LIMIT 1;

  IF v_zone_d04_id IS NULL THEN
    INSERT INTO affected_zones (
      incident_id,
      zone_code,
      zone_name,
      population,
      affected_population,
      risk_score,
      priority_rank,
      severity,
      accessibility,
      medical_need,
      infrastructure_damage,
      status,
      latitude,
      longitude
    ) VALUES (
      v_incident_id,
      'D-04',
      'West Evac',
      6500,
      4120,
      34,
      5,
      'MODERATE',
      'OPEN',
      'LOW',
      'LOW',
      v_zone_status,
      33.5650,
      73.0150
    ) RETURNING id INTO v_zone_d04_id;
  ELSE
    UPDATE affected_zones
    SET
      incident_id = v_incident_id,
      zone_name = 'West Evac',
      population = 6500,
      affected_population = 4120,
      risk_score = 34,
      priority_rank = 5,
      severity = 'MODERATE',
      accessibility = 'OPEN',
      medical_need = 'LOW',
      infrastructure_damage = 'LOW',
      status = v_zone_status,
      latitude = 33.5650,
      longitude = 73.0150
    WHERE id = v_zone_d04_id;
  END IF;

  -- Factor verification: 35*0.30 + 36*0.25 + 35*0.20 + 30*0.15 + 30*0.10 = 10.5 + 9.0 + 7.0 + 4.5 + 3.0 = 34.0
  IF NOT EXISTS (SELECT 1 FROM risk_analyses WHERE zone_id = v_zone_d04_id) THEN
    INSERT INTO risk_analyses (
      zone_id,
      population_score,
      severity_score,
      medical_score,
      accessibility_score,
      infrastructure_score
    ) VALUES (
      v_zone_d04_id,
      35,
      36,
      35,
      30,
      30
    );
  ELSE
    UPDATE risk_analyses
    SET
      population_score = 35,
      severity_score = 36,
      medical_score = 35,
      accessibility_score = 30,
      infrastructure_score = 30
    WHERE zone_id = v_zone_d04_id;
  END IF;

  -- 8. Ensure RLS is Preserved and Public Read Policies Exist
  ALTER TABLE IF EXISTS incidents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS affected_zones ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS risk_analyses ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Allow public select incidents') THEN
    CREATE POLICY "Allow public select incidents" ON incidents FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affected_zones' AND policyname = 'Allow public select affected_zones') THEN
    CREATE POLICY "Allow public select affected_zones" ON affected_zones FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'risk_analyses' AND policyname = 'Allow public select risk_analyses') THEN
    CREATE POLICY "Allow public select risk_analyses" ON risk_analyses FOR SELECT USING (true);
  END IF;

END $$;

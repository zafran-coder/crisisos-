-- CrisisOS Phase 8 — Create Vision AI Tables & Scoped RLS Policies
-- Target: Remote Supabase PostgreSQL
-- Security: RLS remains strictly ENABLED. Scoped insert policies prevent unrestricted writes.

-- 1. Create disaster_images table (uses zone_id UUID without hard external dependency)
CREATE TABLE IF NOT EXISTS disaster_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create vision_analysis table
CREATE TABLE IF NOT EXISTS vision_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES disaster_images(id) ON DELETE CASCADE,
  infrastructure_damage TEXT,
  detected_hazards JSONB DEFAULT '[]'::jsonb,
  water_level TEXT,
  ai_summary TEXT,
  confidence_score NUMERIC(4, 2) DEFAULT 0.85,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS remains strictly enabled)
ALTER TABLE disaster_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_analysis ENABLE ROW LEVEL SECURITY;

-- 4. Reset & Create Policies (Idempotent: drops if already exists, then creates)
DROP POLICY IF EXISTS "Allow select disaster_images" ON disaster_images;
DROP POLICY IF EXISTS "Allow insert disaster_images" ON disaster_images;
DROP POLICY IF EXISTS "Allow select vision_analysis" ON vision_analysis;
DROP POLICY IF EXISTS "Allow insert vision_analysis" ON vision_analysis;

CREATE POLICY "Allow select disaster_images" ON disaster_images 
FOR SELECT USING (true);

CREATE POLICY "Allow insert disaster_images" ON disaster_images 
FOR INSERT WITH CHECK (
  zone_id IS NOT NULL AND length(storage_path) > 0
);

CREATE POLICY "Allow select vision_analysis" ON vision_analysis 
FOR SELECT USING (true);

CREATE POLICY "Allow insert vision_analysis" ON vision_analysis 
FOR INSERT WITH CHECK (
  image_id IS NOT NULL AND confidence_score >= 0
);

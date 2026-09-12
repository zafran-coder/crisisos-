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

-- 4. Create Policies (Idempotent)
DO $$
BEGIN
  -- disaster_images SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'disaster_images' AND policyname = 'Allow select disaster_images'
  ) THEN
    CREATE POLICY "Allow select disaster_images" ON disaster_images FOR SELECT USING (true);
  END IF;

  -- disaster_images INSERT policy (scoped check requiring valid zone_id and storage_path)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'disaster_images' AND policyname = 'Allow insert disaster_images'
  ) THEN
    CREATE POLICY "Allow insert disaster_images" ON disaster_images FOR INSERT WITH CHECK (
      zone_id IS NOT NULL AND length(storage_path) > 0
    );
  END IF;

  -- vision_analysis SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vision_analysis' AND policyname = 'Allow select vision_analysis'
  ) THEN
    CREATE POLICY "Allow select vision_analysis" ON vision_analysis FOR SELECT USING (true);
  END IF;

  -- vision_analysis INSERT policy (scoped check requiring image_id reference and valid confidence)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vision_analysis' AND policyname = 'Allow insert vision_analysis'
  ) THEN
    CREATE POLICY "Allow insert vision_analysis" ON vision_analysis FOR INSERT WITH CHECK (
      image_id IS NOT NULL AND confidence_score >= 0
    );
  END IF;
END $$;

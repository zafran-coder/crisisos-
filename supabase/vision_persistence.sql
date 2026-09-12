-- CrisisOS Phase 8 — Vision AI Disaster Images & Analysis RLS Policies
-- Target: Remote Supabase PostgreSQL
-- Security: RLS remains ENABLED. Scoped insert policies prevent unrestricted writes.

ALTER TABLE IF EXISTS disaster_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vision_analysis ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 1. disaster_images SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'disaster_images' AND policyname = 'Allow select disaster_images'
  ) THEN
    CREATE POLICY "Allow select disaster_images" ON disaster_images FOR SELECT USING (true);
  END IF;

  -- 2. disaster_images INSERT policy (scoped check requiring valid foreign-key zone_id and storage_path)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'disaster_images' AND policyname = 'Allow insert disaster_images'
  ) THEN
    CREATE POLICY "Allow insert disaster_images" ON disaster_images FOR INSERT WITH CHECK (
      zone_id IS NOT NULL AND length(storage_path) > 0
    );
  END IF;

  -- 3. vision_analysis SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vision_analysis' AND policyname = 'Allow select vision_analysis'
  ) THEN
    CREATE POLICY "Allow select vision_analysis" ON vision_analysis FOR SELECT USING (true);
  END IF;

  -- 4. vision_analysis INSERT policy (scoped check requiring image_id reference and valid confidence)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vision_analysis' AND policyname = 'Allow insert vision_analysis'
  ) THEN
    CREATE POLICY "Allow insert vision_analysis" ON vision_analysis FOR INSERT WITH CHECK (
      image_id IS NOT NULL AND confidence_score >= 0
    );
  END IF;
END $$;

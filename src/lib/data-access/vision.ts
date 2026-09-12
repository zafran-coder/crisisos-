import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GeminiVisionAnalysis } from '@/types/vision';

export interface SaveVisionAnalysisParams {
  zoneId: string;
  imageUrl: string;
  storagePath: string;
  analysis: GeminiVisionAnalysis;
}

export interface SaveVisionAnalysisResult {
  success: boolean;
  imageId?: string;
  analysisId?: string;
  error?: string;
}

/**
 * Persists a disaster image record and its associated Gemini Vision analysis
 * into Supabase PostgreSQL tables: `disaster_images` and `vision_analysis`.
 *
 * Uses the verified remote schema:
 * disaster_images: id, zone_id, image_url, storage_path, created_at
 * vision_analysis: id, image_id, infrastructure_damage, detected_hazards, water_level, ai_summary, confidence_score, created_at
 */
export async function persistVisionAnalysis(
  params: SaveVisionAnalysisParams
): Promise<SaveVisionAnalysisResult> {
  const supabase = createServerSupabaseClient();
  const imageId = crypto.randomUUID();
  const analysisId = crypto.randomUUID();

  try {
    // 1. Insert into disaster_images
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: imageError } = await (supabase.from('disaster_images') as any)
      .insert({
        id: imageId,
        zone_id: params.zoneId,
        image_url: params.imageUrl,
        storage_path: params.storagePath,
      });

    if (imageError) {
      return {
        success: false,
        error: `Failed to insert disaster_images record: ${imageError.message}`,
      };
    }

    // 2. Insert into vision_analysis
    const infrastructureDamageSummary =
      params.analysis.infrastructure_damage.length > 0
        ? params.analysis.infrastructure_damage.join('; ')
        : params.analysis.severity_observation.toUpperCase();

    const waterLevelText = params.analysis.water_or_flooding_observed
      ? params.analysis.disaster_type === 'flood'
        ? 'HIGH_FLOODING'
        : 'WATER_OBSERVED'
      : 'NONE';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: analysisError } = await (supabase.from('vision_analysis') as any)
      .insert({
        id: analysisId,
        image_id: imageId,
        infrastructure_damage: infrastructureDamageSummary,
        detected_hazards: params.analysis.visible_hazards,
        water_level: waterLevelText,
        ai_summary: params.analysis.summary,
        confidence_score: params.analysis.confidence,
      });

    if (analysisError) {
      return {
        success: false,
        imageId,
        error: `disaster_images saved, but vision_analysis insert failed: ${analysisError.message}`,
      };
    }

    return {
      success: true,
      imageId,
      analysisId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Retrieves recent vision analyses for a given zone.
 */
export async function getRecentVisionAnalysesForZone(zoneId: string) {
  const supabase = createServerSupabaseClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawImages, error: imagesError } = await (supabase.from('disaster_images') as any)
      .select('id, image_url, storage_path, created_at')
      .eq('zone_id', zoneId)
      .order('created_at', { ascending: false })
      .limit(5);

    interface LocalDisasterImage {
      id: string;
      image_url: string;
      storage_path: string;
      created_at?: string;
    }

    interface LocalVisionAnalysis {
      id: string;
      image_id: string;
      infrastructure_damage: string;
      detected_hazards: unknown;
      water_level: string;
      ai_summary: string;
      confidence_score: number;
      created_at?: string;
    }

    const images = (rawImages || []) as LocalDisasterImage[];
    if (imagesError || images.length === 0) {
      return [];
    }

    const imageIds = images.map((img) => img.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawAnalyses } = await (supabase.from('vision_analysis') as any)
      .select('*')
      .in('image_id', imageIds);

    const analyses = (rawAnalyses || []) as LocalVisionAnalysis[];

    return analyses.map((a) => ({
      ...a,
      image: images.find((i) => i.id === a.image_id),
    }));
  } catch {
    return [];
  }
}

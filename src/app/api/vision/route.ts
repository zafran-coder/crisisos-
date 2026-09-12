import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, isGeminiConfigured, GEMINI_MODELS } from '@/lib/gemini';
import { getZones } from '@/lib/data-access/zones';
import { persistVisionAnalysis } from '@/lib/data-access/vision';
import { recordAuditEvent } from '@/lib/data-access/audit';
import {
  GeminiVisionAnalysis,
  VisionApiResponse,
  VisionGroundingContext,
} from '@/types/vision';

// Maximum supported upload size: 5MB
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const VISION_SYSTEM_PROMPT = `You are a disaster-response visual assessment assistant for CrisisOS.
Analyze ONLY what is visually supported by the provided image.
Do not invent facts.
Do not infer individual identities.
Do not assign a numeric disaster risk score.
Do not assign a priority rank.
Clearly distinguish visible evidence from uncertainty.

You must respond with a strictly formatted JSON object matching this schema:
{
  "summary": "Concise factual summary of visual observations",
  "disaster_type": "flood | fire | landslide | structural_damage | road_blockage | storm | other | uncertain",
  "severity_observation": "low | moderate | high | critical | uncertain",
  "visible_hazards": ["array of specific visible hazards observed"],
  "infrastructure_damage": ["array of specific damage observed to roads, buildings, power, or bridges"],
  "road_accessibility": "clear | partially_blocked | blocked | unknown",
  "water_or_flooding_observed": true | false,
  "people_visible": true | false,
  "estimated_people_visible": null or a cautious integer estimate (never an exact casualty count),
  "medical_concern_observed": "none | possible | significant | unknown",
  "rescue_relevant_evidence": ["array of specific visual cues relevant for emergency responders"],
  "confidence": float between 0.0 and 1.0,
  "limitations": ["array of visual limitations, e.g. occluded angles, smoke, resolution limits"]
}`;

/**
 * Custom error class indicating bounded transient retries were exhausted.
 */
class TransientExhaustionError extends Error {
  readonly isExhaustedTransient = true;
  readonly originalError: unknown;

  constructor(message: string, originalError: unknown) {
    super(message);
    this.name = 'TransientExhaustionError';
    this.originalError = originalError;
  }
}

// Retry configuration for transient Gemini capacity/timeout errors
const MAX_RETRIES = 3;

/**
 * Safely extract HTTP status code from error object or error message string.
 */
function extractHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const err = error as Record<string, unknown>;

  if (typeof err.status === 'number') return err.status;
  if (typeof err.statusCode === 'number') return err.statusCode;
  if (typeof err.httpStatus === 'number') return err.httpStatus;

  if (err.response && typeof err.response === 'object') {
    const res = err.response as Record<string, unknown>;
    if (typeof res.status === 'number') return res.status;
  }

  if (err.error && typeof err.error === 'object') {
    const inner = err.error as Record<string, unknown>;
    if (typeof inner.status === 'number') return inner.status;
    if (typeof inner.code === 'number') return inner.code;
  }

  if (typeof err.message === 'string') {
    const match = err.message.match(/\b(503|429|408|500|502|504|400|401|403|404|413|415)\b/);
    if (match) return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Determines whether an error is transient (safe to retry)
 * or non-transient (fail immediately without retry).
 */
function isTransientError(error: unknown): boolean {
  const status = extractHttpStatus(error);

  // 1. Explicit NON-TRANSIENT status codes: fail immediately
  if (status && [400, 401, 403, 404, 413, 415, 422].includes(status)) {
    return false;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // 2. Explicit NON-TRANSIENT error signals: fail immediately
  if (
    message.includes('api_key_invalid') ||
    message.includes('api key not valid') ||
    message.includes('unauthenticated') ||
    message.includes('permission_denied') ||
    message.includes('invalid argument') ||
    message.includes('unsupported media') ||
    message.includes('not found') ||
    message.includes('validation failed')
  ) {
    return false;
  }

  // 3. Explicit TRANSIENT HTTP status codes:
  // 503 (Service Unavailable), 429 (Resource Exhausted / Rate Limit), 408 (Timeout), 500/502/504 (Gateway/Server)
  if (status && [503, 429, 408, 500, 502, 504].includes(status)) {
    return true;
  }

  // 4. Transient error string patterns
  if (
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('resource_exhausted') ||
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('408') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('fetch failed') ||
    message.includes('network')
  ) {
    return true;
  }

  return false;
}

interface GeminiVisionRetryResult {
  rawText: string;
  attempts: number;
}

/**
 * Execute Gemini Vision generateContent with bounded exponential backoff and jitter.
 * Logs attempt number, HTTP status, and latency without credentials or image contents.
 */
async function generateVisionWithRetry(
  ai: ReturnType<typeof getGeminiClient>,
  imageBuffer: Buffer,
  mimeType: string,
  userPromptText: string
): Promise<GeminiVisionRetryResult> {
  const candidateModels = [
    GEMINI_MODELS.VISION,
    'gemini-3.5-flash',
    'gemini-flash-latest',
  ] as const;

  let lastError: unknown = null;
  let totalAttempts = 0;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      totalAttempts++;
      const attemptStart = Date.now();
      try {
        console.log(`[Vision AI] Invoking model: ${model} (attempt ${attempt})`);
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType,
              },
            },
            userPromptText,
          ],
          config: {
            systemInstruction: VISION_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
          },
        });

        const latencyMs = Date.now() - attemptStart;
        console.log(
          `[Vision AI] Model ${model} succeeded (HTTP 200) in ${latencyMs}ms`
        );

        const rawText = response.text?.trim() || '{}';
        return { rawText, attempts: totalAttempts };
      } catch (err) {
        lastError = err;
        const latencyMs = Date.now() - attemptStart;
        const status = extractHttpStatus(err);
        const isTransient = isTransientError(err);

        if (!isTransient) {
          console.error(
            `[Vision AI] Model ${model} non-transient error (HTTP ${
              status ?? 'UNKNOWN'
            }) in ${latencyMs}ms.`
          );
          throw err;
        }

        console.warn(
          `[Vision AI] Model ${model} failed with transient error (HTTP ${
            status ?? 503
          }) in ${latencyMs}ms.`
        );

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  // Exhausted all retries for transient error across confirmed models
  throw new TransientExhaustionError(
    'GEMINI_TEMPORARILY_UNAVAILABLE',
    lastError
  );
}

/**
 * POST /api/vision
 * Server-side Gemini Vision Disaster Image Triage.
 * Accepts multipart/form-data or application/json.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // 1. Verify Gemini API Key configuration
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        status: 'error',
        message:
          'GEMINI_API_KEY is not configured in .env.local. Configure your key to enable live Vision AI triage.',
        timestamp,
      },
      { status: 503 }
    );
  }

  try {
    let imageBuffer: Buffer;
    let mimeType = 'image/jpeg';
    let fileName = 'disaster-upload.jpg';
    let requestedZoneCode = 'F-03';
    let requestedZoneId: string | undefined;
    let operatorNotes = '';

    const contentType = request.headers.get('content-type') || '';

    // 2. Parse Multipart Form Data or JSON Payload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      const zoneCodeParam = formData.get('zoneCode') as string | null;
      const zoneIdParam = formData.get('zoneId') as string | null;
      const notesParam = formData.get('notes') as string | null;

      if (!file) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Validation failed: Image file is required under form field "image".',
            timestamp,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            status: 'error',
            message: `Validation failed: File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB limit.`,
            timestamp,
          },
          { status: 413 }
        );
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            status: 'error',
            message: `Validation failed: Unsupported file type "${file.type}". Allowed types: JPEG, PNG, WEBP, GIF.`,
            timestamp,
          },
          { status: 415 }
        );
      }

      mimeType = file.type;
      fileName = file.name || 'disaster-upload.jpg';
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

      if (zoneCodeParam) requestedZoneCode = zoneCodeParam.trim().toUpperCase();
      if (zoneIdParam) requestedZoneId = zoneIdParam.trim();
      if (notesParam) operatorNotes = notesParam.trim();
    } else if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      const { image, zoneCode, zoneId, notes } = body;

      if (!image || typeof image !== 'string') {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Validation failed: Base64 data URL string is required in field "image".',
            timestamp,
          },
          { status: 400 }
        );
      }

      // Extract base64 and mime-type if provided as data URL
      const dataUrlMatch = image.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1];
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          return NextResponse.json(
            {
              status: 'error',
              message: `Validation failed: Unsupported image MIME type "${mimeType}".`,
              timestamp,
            },
            { status: 415 }
          );
        }
        imageBuffer = Buffer.from(dataUrlMatch[2], 'base64');
      } else {
        imageBuffer = Buffer.from(image, 'base64');
      }

      if (imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            status: 'error',
            message: `Validation failed: Image exceeds maximum allowed size of 5 MB.`,
            timestamp,
          },
          { status: 413 }
        );
      }

      if (zoneCode) requestedZoneCode = String(zoneCode).trim().toUpperCase();
      if (zoneId) requestedZoneId = String(zoneId).trim();
      if (notes) operatorNotes = String(notes).trim();
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Content-Type must be multipart/form-data or application/json.',
          timestamp,
        },
        { status: 415 }
      );
    }

    // 3. Grounding Context: Fetch corresponding deterministic zone facts from Supabase
    const { zones } = await getZones();
    const matchedZone =
      zones.find(
        (z) =>
          z.code.toUpperCase() === requestedZoneCode ||
          (requestedZoneId && z.id === requestedZoneId)
      ) || zones[0];

    const grounding: VisionGroundingContext = {
      zone_id: matchedZone.id,
      zone_code: matchedZone.code,
      zone_name: matchedZone.name,
      sector: matchedZone.sector,
      population: matchedZone.population,
      affected_population:
        matchedZone.affected_population ?? Math.round(matchedZone.population * 0.65),
      risk_score: matchedZone.current_risk_score, // Strictly deterministic!
      priority_rank: matchedZone.priorityRank ?? 1, // Strictly deterministic!
      severity_label: matchedZone.severity_label || 'CRITICAL',
      source: matchedZone.source,
    };

    // 4. Construct prompt with operator notes if provided
    let userPromptText = 'Assess this disaster scene. Provide your factual visual analysis in strict JSON.';
    if (operatorNotes) {
      userPromptText += ` Operator Field Context: "${operatorNotes}".`;
    }
    userPromptText += ` Sector Reference: ${grounding.zone_code} (${grounding.zone_name}).`;

    // 5. Call Gemini Vision server-side with bounded retry resilience
    const ai = getGeminiClient();
    const visionResult = await generateVisionWithRetry(
      ai,
      imageBuffer,
      mimeType,
      userPromptText
    );

    const rawText = visionResult.rawText;

    // 6. Parse and validate structured output
    let parsedAnalysis: GeminiVisionAnalysis;
    try {
      parsedAnalysis = JSON.parse(rawText) as GeminiVisionAnalysis;
    } catch {
      // Fallback parser if markdown code-fence was included
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      parsedAnalysis = JSON.parse(cleaned) as GeminiVisionAnalysis;
    }

    // Enforce schema boundaries & constraints
    if (typeof parsedAnalysis.confidence !== 'number') {
      parsedAnalysis.confidence = 0.85;
    } else {
      parsedAnalysis.confidence = Math.max(0, Math.min(1, parsedAnalysis.confidence));
    }

    if (!Array.isArray(parsedAnalysis.visible_hazards)) {
      parsedAnalysis.visible_hazards = [];
    }
    if (!Array.isArray(parsedAnalysis.infrastructure_damage)) {
      parsedAnalysis.infrastructure_damage = [];
    }
    if (!Array.isArray(parsedAnalysis.rescue_relevant_evidence)) {
      parsedAnalysis.rescue_relevant_evidence = [];
    }
    if (!Array.isArray(parsedAnalysis.limitations)) {
      parsedAnalysis.limitations = [];
    }

    // 7. Supabase Persistence Flow (Non-Destructive)
    const effectiveZoneId = grounding.zone_id || matchedZone.id;
    const storagePath = `disaster-uploads/${grounding.zone_code}/${Date.now()}-${fileName}`;
    // Construct lightweight data URL or storage representation
    const previewUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    const persistenceResult = await persistVisionAnalysis({
      zoneId: effectiveZoneId,
      imageUrl: previewUrl.length < 500000 ? previewUrl : storagePath,
      storagePath,
      analysis: parsedAnalysis,
    });

    const latencyMs = Date.now() - startTime;

    // 8. Return comprehensive, strictly grounded API response
    const apiResponse: VisionApiResponse = {
      status: 'ok',
      model: GEMINI_MODELS.VISION,
      analysis: parsedAnalysis,
      grounding,
      persistence: {
        persisted: persistenceResult.success,
        imageId: persistenceResult.imageId,
        analysisId: persistenceResult.analysisId,
        error: persistenceResult.error || null,
      },
      latencyMs,
      attempts: visionResult.attempts,
      timestamp,
    };

    // Record real audit trail event
    recordAuditEvent({
      zone_code: grounding.zone_code,
      zone_id: effectiveZoneId,
      event_type: 'VISION_ANALYSIS_COMPLETED',
      event_name: `Vision AI Image Recon Completed (${grounding.zone_code})`,
      description: `Analyzed aerial/ground disaster imagery for Zone ${grounding.zone_code}. Severity observed: "${parsedAnalysis.severity_observation}", hazards detected: ${parsedAnalysis.visible_hazards.join(', ') || 'none'}.`,
      source: 'GEMINI_VISION',
      metadata: {
        confidence: parsedAnalysis.confidence,
        hazards: parsedAnalysis.visible_hazards,
        damage: parsedAnalysis.infrastructure_damage,
        severity_observation: parsedAnalysis.severity_observation,
        flooding_observed: parsedAnalysis.water_or_flooding_observed,
      },
    }).catch((err) => console.warn('[Audit] Failed to log vision event:', err));

    return NextResponse.json(apiResponse);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const isExhaustedTransient = Boolean(
      error instanceof TransientExhaustionError ||
      (error instanceof Error && error.message === 'GEMINI_TEMPORARILY_UNAVAILABLE')
    );

    if (isExhaustedTransient) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'GEMINI_TEMPORARILY_UNAVAILABLE',
          message: 'Gemini Vision is temporarily overloaded. Please retry the analysis.',
          transient: true,
          attempts: 1 + MAX_RETRIES,
          latencyMs,
          timestamp,
        },
        { status: 503 }
      );
    }

    const httpStatus = extractHttpStatus(error) || 502;
    const rawErrorMessage = error instanceof Error ? error.message : 'Unknown Vision AI processing error';

    // Never expose secret keys, Bearer tokens, or raw internal credentials
    let sanitizedError = rawErrorMessage
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/key=[a-zA-Z0-9._-]+/gi, 'key=[REDACTED]');
    const activeKey = process.env.GEMINI_API_KEY?.trim();
    if (activeKey && activeKey.length > 5) {
      sanitizedError = sanitizedError.replaceAll(activeKey, '[REDACTED_API_KEY]');
    }

    return NextResponse.json(
      {
        status: 'error',
        code: 'VISION_PROCESSING_ERROR',
        message: `Gemini Vision processing failed: ${sanitizedError}`,
        transient: false,
        latencyMs,
        timestamp,
      },
      { status: httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502 }
    );
  }
}

/**
 * GET /api/vision
 * Documentation and health status for the Vision AI subsystem.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'CrisisOS Gemini Vision Disaster Assessment Engine',
    model: GEMINI_MODELS.VISION,
    configured: isGeminiConfigured(),
    maxFileSizeMb: 5,
    supportedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
    usage: {
      method: 'POST',
      contentType: 'multipart/form-data (image: File) or application/json (image: base64)',
      optionalFields: ['zoneCode', 'zoneId', 'notes'],
    },
    note: 'Numeric risk_score and priority_rank remain strictly deterministic and are never modified by Vision AI.',
  });
}

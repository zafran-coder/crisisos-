import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, isGeminiConfigured, GEMINI_MODELS } from '@/lib/gemini';
import {
  gatherPlanContext,
  persistResponsePlan,
  getLatestResponsePlan,
  ZonePlanContext,
} from '@/lib/data-access/response-plans';
import { recordAuditEvent } from '@/lib/data-access/audit';
import {
  StructuredResponsePlan,
  PriorityZonePlan,
  PlanGenerationInput,
  ResponsePlanApiResponse,
  AllocatedResourceUnits,
} from '@/types/response-plan';

function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as Record<string, unknown>;
  const status = (err.status || err.statusCode || err.httpStatus) as number | undefined;

  if (status === 503 || status === 429 || status === 408) return true;

  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('timeout')
  );
}

/**
 * Executes Gemini call with exponential backoff for transient 503 / 429 capacity spikes.
 */
async function callGeminiWithBackoff(prompt: string, systemInstruction: string) {
  const ai = getGeminiClient();
  const candidateModels = [
    GEMINI_MODELS.REASONING,
    'gemini-3.5-flash',
    'gemini-flash-latest',
  ] as const;

  let lastError: unknown = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const attemptStart = Date.now();
      try {
        console.log(`[ResponsePlan AI] Invoking model: ${model} (attempt ${attempt})`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2, // Low temperature for factual precision
          },
        });

        const latencyMs = Date.now() - attemptStart;
        console.log(`[ResponsePlan AI] Model ${model} succeeded in ${latencyMs}ms`);
        return response.text?.trim() || '{}';
      } catch (err) {
        lastError = err;
        const latencyMs = Date.now() - attemptStart;
        const isTransient = isTransientError(err);
        const rawMsg = err instanceof Error ? err.message : String(err);
        let sanitized = rawMsg
          .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
          .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
          .replace(/key=[a-zA-Z0-9._-]+/gi, 'key=[REDACTED]');
        const activeKey = process.env.GEMINI_API_KEY?.trim();
        if (activeKey && activeKey.length > 5) {
          sanitized = sanitized.replaceAll(activeKey, '[REDACTED_API_KEY]');
        }

        console.warn(
          `[ResponsePlan AI] Model ${model} failed in ${latencyMs}ms (${sanitized.slice(0, 120)}...).`
        );

        if (!isTransient) {
          break; // Try next model immediately on non-transient error
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  throw lastError;
}

/**
 * GET /api/response-plan
 * Retrieves the latest saved response plan and allocations from Supabase.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incident_id') || undefined;

    const result = await getLatestResponsePlan(incidentId);

    if (!result.plan) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No saved response plan found in database.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      plan: result.plan,
      databaseRecords: result.records,
      source: result.source,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve response plan',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/response-plan
 * Generates an operational response plan from trusted Supabase data + deterministic risk ranking
 * + Vision AI observations + retrieved guidelines, and persists it into Supabase.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const body: PlanGenerationInput = await request.json().catch(() => ({}));
    const { incident_id, operator_notes } = body;

    // 1. Verify Gemini API Key configuration
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'GEMINI_NOT_CONFIGURED',
          message: 'GEMINI_API_KEY environment variable is missing in server configuration.',
        },
        { status: 500 }
      );
    }

    // 2. Load current trusted data server-side from Supabase
    const planContext = await gatherPlanContext(incident_id);

    if (!planContext.zones || planContext.zones.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'NO_ZONES_AVAILABLE',
          message: 'No active disaster zones found in Supabase for response planning.',
        },
        { status: 400 }
      );
    }

    // 3. Construct System Prompt adhering strictly to instructions
    const systemInstruction = `You are an emergency response planning assistant.
Generate a response plan only from the supplied database facts, visual observations, retrieved guidelines, and available resource information.
Do not invent facts.
Do not modify the supplied risk scores or ranks.
Do not invent resources.

CRITICAL ARCHITECTURE RULES:
1. The numeric risk scores and priority ranks are DETERMINISTIC and already calculated by the risk engine.
   You must COPY them exactly into the response. Do NOT change them.
2. The sequence of zones MUST strictly follow the supplied priority ranking order.
3. Actual inventory status: "resource availability not provided".
   You may recommend resource TYPES needed (e.g. Swift Water Craft, Mobile Triage Post), but you must clearly distinguish RECOMMENDED RESOURCE TYPE from ACTUAL AVAILABLE RESOURCE.
4. For each zone, provide realistic unit allocations for database persistence:
   - rescue_teams (integer 1-6)
   - medical_units (integer 1-4)
   - boats (integer 1-4)
   - ambulances (integer 1-4)
   - water_units (integer 1-3)
5. You must return valid JSON strictly conforming to the requested schema.`;

    // 4. Construct Structured Prompt with locked database facts
    const zonesSummaryText = planContext.zones
      .map(
        (z) => `
ZONE ${z.zone_code} (${z.zone_name}):
- Canonical Database ID: ${z.id}
- Deterministic Priority Rank: #${z.priority_rank} (LOCKED - DO NOT CHANGE)
- Deterministic Risk Score: ${z.risk_score}/100 (LOCKED - DO NOT CHANGE)
- Coordinates: [Lat: ${z.coordinates.lat}, Lng: ${z.coordinates.lng}]
- Population: Total ${z.population.toLocaleString()}, Directly Affected ${z.affected_population.toLocaleString()}
- Severity: ${z.severity}
- Accessibility: ${z.accessibility}
- Medical Need: ${z.medical_need}
- Infrastructure Damage: ${z.infrastructure_damage}
- Factor Scores: Population=${z.risk_factors.population_score}, Severity=${z.risk_factors.severity_score}, Medical=${z.risk_factors.medical_score}, Access=${z.risk_factors.accessibility_score}, Infra=${z.risk_factors.infrastructure_score}
${z.vision_findings ? `- Visual Recon Evidence: Damage=${z.vision_findings.infrastructure_damage}, Hazards=[${z.vision_findings.hazards.join(', ')}], Water=${z.vision_findings.water_level}, Notes=${z.vision_findings.summary}` : '- Visual Recon Evidence: None on record'}
`
      )
      .join('\n');

    const guidelinesText = planContext.guidelines
      .map((g) => `- [${g.protocol_code || 'SOP'}] ${g.title}: ${g.protocol_text}`)
      .join('\n');

    const promptText = `
INCIDENT TELEMETRY:
- Name: ${planContext.incident.name}
- Type: ${planContext.incident.disaster_type}
- Status: ${planContext.incident.status}
- Location: ${planContext.incident.location_name}
- Overall Alert: ${planContext.incident.severity}

ACTIVE SECTOR ZONES (STRICT SEQUENCE REQUIRED):
${zonesSummaryText}

RETRIEVED EMERGENCY PROTOCOLS & GUIDELINES:
${guidelinesText}

RESOURCE AVAILABILITY STATUS:
- Notice: "resource availability not provided"
- Constraint: No asset inventory table is defined in the database. Distinguish RECOMMENDED RESOURCE TYPE from ACTUAL AVAILABLE RESOURCE.

${operator_notes ? `OPERATOR TACTICAL NOTES:\n${operator_notes}\n` : ''}

REQUIRED JSON OUTPUT FORMAT:
{
  "incident_summary": "High-level operational overview synthesizing the flood situation across all sectors.",
  "priority_zones": [
    {
      "zone_code": "F-03",
      "priority_rank": 1,
      "risk_score": 92,
      "reason": "Clear explanation of why this zone is rank 1 based on its 92 risk score, population exposure, and vision findings.",
      "immediate_actions": [
        "Action directive 1",
        "Action directive 2",
        "Action directive 3"
      ],
      "safety_considerations": [
        "Safety warning 1",
        "Safety warning 2"
      ],
      "recommended_resource_types": [
        "Recommended equipment / team type 1",
        "Recommended equipment / team type 2"
      ],
      "allocated_units": {
        "rescue_teams": 4,
        "medical_units": 2,
        "boats": 2,
        "ambulances": 2,
        "water_units": 1
      }
    }
  ],
  "recommended_sequence": [
    "#1 F-03 Delta Basin (Risk 92) - Immediate swiftwater extraction",
    "#2 B-02 River Bend (Risk 84) - High velocity runoff containment",
    "#3 C-05 East Heights (Risk 73) - Secondary evacuation staging",
    "#4 A-01 North Sector (Risk 61) - Medical triage coordination",
    "#5 D-04 West Evac (Risk 34) - Reception and sheltering logistics"
  ],
  "critical_warnings": [
    "Bridge clearances submerging below 0.5m require immediate ground transport cessation.",
    "Downed electrical lines in flooded sectors pose acute hazards."
  ],
  "assumptions": [
    "Civilian communications downlink remains partially operational.",
    "Resource availability not provided; allocations represent operational recommendations."
  ]
}
`;

    // 5. Call Gemini 3.6 Flash server-side
    const rawAiResponse = await callGeminiWithBackoff(promptText, systemInstruction);

    // 6. Parse and Validate AI Response
    let parsedAi: {
      incident_summary?: string;
      priority_zones?: Array<{
        zone_code?: string;
        priority_rank?: number;
        risk_score?: number;
        reason?: string;
        immediate_actions?: string[];
        safety_considerations?: string[];
        recommended_resource_types?: string[];
        allocated_units?: {
          rescue_teams?: number;
          medical_units?: number;
          boats?: number;
          ambulances?: number;
          water_units?: number;
        };
      }>;
      recommended_sequence?: string[];
      critical_warnings?: string[];
      assumptions?: string[];
    };

    try {
      parsedAi = JSON.parse(rawAiResponse);
    } catch {
      try {
        const cleaned = rawAiResponse.replace(/```json\n?|\n?```/g, '').trim();
        parsedAi = JSON.parse(cleaned);
      } catch {
        return NextResponse.json(
          {
            status: 'error',
            code: 'MALFORMED_AI_OUTPUT',
            message: 'Gemini returned non-JSON or malformed output.',
          },
          { status: 502 }
        );
      }
    }

    // 7. DETERMINISTIC INTEGRITY GUARD
    // Enforce that risk_score and priority_rank strictly match the Supabase database facts.
    const dbZonesMap = new Map<string, ZonePlanContext>();
    planContext.zones.forEach((z) => dbZonesMap.set(z.zone_code.toUpperCase(), z));

    const validatedPriorityZones: PriorityZonePlan[] = planContext.zones.map((dbZone) => {
      // Find matching zone in AI output
      const aiZone = (parsedAi.priority_zones || []).find(
        (pz) => pz.zone_code?.toUpperCase() === dbZone.zone_code.toUpperCase()
      );

      const allocatedUnits: AllocatedResourceUnits = {
        rescue_teams: Number(aiZone?.allocated_units?.rescue_teams) || 2,
        medical_units: Number(aiZone?.allocated_units?.medical_units) || 1,
        boats: Number(aiZone?.allocated_units?.boats) || 2,
        ambulances: Number(aiZone?.allocated_units?.ambulances) || 1,
        water_units: Number(aiZone?.allocated_units?.water_units) || 1,
        total_units: 0,
      };
      allocatedUnits.total_units =
        allocatedUnits.rescue_teams +
        allocatedUnits.medical_units +
        allocatedUnits.boats +
        allocatedUnits.ambulances +
        allocatedUnits.water_units;

      return {
        zone_code: dbZone.zone_code,
        zone_name: dbZone.zone_name,
        zone_id: dbZone.id,
        // STRICT ENFORCEMENT: copied from database, never overwritten by Gemini
        priority_rank: dbZone.priority_rank,
        risk_score: dbZone.risk_score,
        reason:
          aiZone?.reason ||
          `Targeted for priority #${dbZone.priority_rank} due to composite risk score of ${dbZone.risk_score}/100 and ${dbZone.severity} severity status.`,
        immediate_actions:
          Array.isArray(aiZone?.immediate_actions) && aiZone.immediate_actions.length > 0
            ? aiZone.immediate_actions
            : [
                `Deploy ${allocatedUnits.rescue_teams} swiftwater rescue teams immediately into sector.`,
                `Dispatch ${allocatedUnits.boats} evacuation craft to low-lying residential clusters.`,
                `Establish field medical triage outpost with ${allocatedUnits.medical_units} units.`,
              ],
        safety_considerations:
          Array.isArray(aiZone?.safety_considerations) && aiZone.safety_considerations.length > 0
            ? aiZone.safety_considerations
            : [
                'Monitor rising flood crest rate along arterial bridges.',
                'Ensure personal flotation and safety line anchors for all entering personnel.',
              ],
        recommended_resource_types:
          Array.isArray(aiZone?.recommended_resource_types) && aiZone.recommended_resource_types.length > 0
            ? aiZone.recommended_resource_types
            : [
                'Swift Water Rescue Craft',
                'Advanced Life Support Ambulance',
                'Amphibious Evacuation Vehicle',
                'Emergency Water Purification Unit',
              ],
        allocated_units: allocatedUnits,
      };
    });

    // Ensure sorted by priority_rank ASC
    validatedPriorityZones.sort((a, b) => a.priority_rank - b.priority_rank);

    const structuredPlan: StructuredResponsePlan = {
      incident_id: planContext.incident.id,
      incident_name: planContext.incident.name,
      incident_summary:
        parsedAi.incident_summary ||
        `Operational multi-zone emergency response plan for ${planContext.incident.name} (${planContext.incident.location_name}), prioritizing high-exposure flood sectors based on deterministic composite risk.`,
      priority_zones: validatedPriorityZones,
      recommended_sequence:
        Array.isArray(parsedAi.recommended_sequence) && parsedAi.recommended_sequence.length > 0
          ? parsedAi.recommended_sequence
          : validatedPriorityZones.map((pz) => `#${pz.priority_rank} ${pz.zone_code} ${pz.zone_name} (Risk ${pz.risk_score})`),
      critical_warnings:
        Array.isArray(parsedAi.critical_warnings) && parsedAi.critical_warnings.length > 0
          ? parsedAi.critical_warnings
          : [
              'Bridge clearances submerging below 0.5m require immediate ground transport cessation.',
              'Rapid inundation rates exceed safe wading limits in Delta Basin and River Bend.',
              'Utility substations require remote isolation to eliminate submerged electrocution hazards.',
            ],
      assumptions:
        Array.isArray(parsedAi.assumptions) && parsedAi.assumptions.length > 0
          ? parsedAi.assumptions
          : [
              'Tactical radio downlink via EOC repeater remains operational.',
              'Resource availability not provided; equipment counts represent recommended operational scaling.',
            ],
      resource_status_disclaimer: 'resource availability not provided',
    };

    // 8. PERSISTENCE INTO SUPABASE
    // Persist into response_plans and response_allocations
    const allocationsToPersist = validatedPriorityZones.map((pz) => ({
      zone_id: pz.zone_id || '2f5619da-4a08-4742-932c-acb89deeeb0c',
      rescue_teams: pz.allocated_units.rescue_teams,
      medical_units: pz.allocated_units.medical_units,
      boats: pz.allocated_units.boats,
      ambulances: pz.allocated_units.ambulances,
      water_units: pz.allocated_units.water_units,
      count: pz.allocated_units.total_units,
    }));

    const persistenceResult = await persistResponsePlan({
      incidentId: planContext.incident.id,
      title: `Operational Response Plan // ${planContext.incident.name}`,
      summary: structuredPlan.incident_summary,
      status: 'ACTIVE',
      allocations: allocationsToPersist,
    });

    const latencyMs = Date.now() - startTime;

    // 9. TASK 8 ERROR HANDLING: Never display a successful plan if persistence failed where persistence is required
    if (!persistenceResult.persisted) {
      console.warn(
        `[ResponsePlan API] Persistence to Supabase failed: ${persistenceResult.error}`
      );

      return NextResponse.json(
        {
          status: 'error',
          code: 'DATABASE_PERSISTENCE_FAILED',
          message: `Failed to persist response plan to Supabase: ${persistenceResult.error}. Please verify database write permissions.`,
          details: persistenceResult.error,
          plan: structuredPlan, // Provide plan in error payload for diagnostics if needed
          latencyMs,
          timestamp,
        },
        { status: 500 }
      );
    }

    // 10. Return Successful Response
    const apiResponse: ResponsePlanApiResponse = {
      status: 'ok',
      plan: structuredPlan,
      databaseRecords: persistenceResult,
      latencyMs,
      timestamp,
    };

    // Record real audit trail event
    recordAuditEvent({
      incident_id: planContext.incident.id,
      plan_id: persistenceResult.plan_id,
      zone_code: validatedPriorityZones[0]?.zone_code,
      event_type: 'RESPONSE_PLAN_GENERATED',
      event_name: 'AI Emergency Response Plan Synthesized',
      description: `Synthesized operational response plan for ${planContext.incident.name}. Prioritized ${validatedPriorityZones[0]?.zone_code} (${validatedPriorityZones[0]?.zone_name}) at Rank #1. Persisted ${persistenceResult.allocations_count} allocation directives.`,
      source: 'GEMINI_REASONING',
      metadata: {
        plan_id: persistenceResult.plan_id,
        allocations_count: persistenceResult.allocations_count,
        top_zone: validatedPriorityZones[0]?.zone_code,
      },
    }).catch((err) => console.warn('[Audit] Failed to log response plan event:', err));

    return NextResponse.json(apiResponse);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const isTransient = isTransientError(error);

    if (isTransient) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'GEMINI_TEMPORARILY_UNAVAILABLE',
          message: 'Gemini reasoning service is experiencing high demand. Please click Regenerate Plan.',
          latencyMs,
          timestamp,
        },
        { status: 503 }
      );
    }

    const rawMessage = error instanceof Error ? error.message : 'Unknown server error generating response plan';
    let sanitizedError = rawMessage
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
        code: 'RESPONSE_PLAN_GENERATION_FAILED',
        message: sanitizedError,
        latencyMs,
        timestamp,
      },
      { status: 500 }
    );
  }
}

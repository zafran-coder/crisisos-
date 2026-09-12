import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, isGeminiConfigured, GEMINI_MODELS } from '@/lib/gemini';
import { gatherPlanContext, persistResponsePlan } from '@/lib/data-access/response-plans';
import {
  calculateDeterministicAllocations,
} from '@/lib/allocations/engine';
import {
  getEmergencyInventory,
  persistZoneAllocations,
  getLatestAllocations,
  setLatestAllocationsCache,
} from '@/lib/data-access/allocations';
import { recordAuditEvent } from '@/lib/data-access/audit';
import {
  AllocationsApiResponse,
  ResourceMatrixPayload,
  ResourceType,
} from '@/types/allocations';

/**
 * GET /api/allocations
 * Retrieves current resource allocation and inventory matrix.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incident_id') || undefined;

    // 1. Try to load saved allocations from Supabase
    const savedMatrix = await getLatestAllocations(incidentId);
    if (savedMatrix) {
      return NextResponse.json({
        status: 'ok',
        data: savedMatrix,
      });
    }

    // 2. If no saved allocations yet, calculate initial deterministic preview
    const planContext = await gatherPlanContext(incidentId);
    const { inventory } = await getEmergencyInventory(incidentId);

    const customInventoryMap: Record<ResourceType, number> = {
      RESCUE_TEAMS: 18,
      RESCUE_BOATS: 12,
      AMBULANCES: 10,
      MEDICAL_UNITS: 8,
      WATER_UNITS: 6,
    };
    inventory.forEach((i) => {
      customInventoryMap[i.resource_type] = i.total_available;
    });

    const deterministic = calculateDeterministicAllocations(
      planContext.zones,
      customInventoryMap
    );

    const previewMatrix: ResourceMatrixPayload = {
      incident_id: planContext.incident.id,
      incident_name: planContext.incident.name,
      inventory_type: 'SIMULATED DEMO INVENTORY',
      inventory: deterministic.inventory,
      zone_allocations: deterministic.zoneAllocations,
      strategic_explanation:
        'Tactical asset distribution concentrates swiftwater craft and medical posts in high-priority zones (F-03 and B-02), while staging perimeter support in secondary sectors.',
      total_inventory: deterministic.totalAvailable,
      total_allocated: deterministic.totalAllocated,
      persisted: false,
    };

    return NextResponse.json({
      status: 'ok',
      data: previewMatrix,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve allocations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/allocations
 * Calculates deterministic resource allocation from trusted Supabase data,
 * generates AI strategic rationale, and persists allocations to Supabase.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json().catch(() => ({}));
    const { incident_id } = body;

    // 1. Load trusted data server-side from Supabase
    const planContext = await gatherPlanContext(incident_id);
    if (!planContext.zones || planContext.zones.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'NO_ZONES_AVAILABLE',
          message: 'No active disaster zones found in Supabase for resource allocation.',
        },
        { status: 400 }
      );
    }

    // 2. Load inventory
    const { inventory } = await getEmergencyInventory(incident_id);
    const customInventoryMap: Record<ResourceType, number> = {
      RESCUE_TEAMS: 18,
      RESCUE_BOATS: 12,
      AMBULANCES: 10,
      MEDICAL_UNITS: 8,
      WATER_UNITS: 6,
    };
    inventory.forEach((i) => {
      customInventoryMap[i.resource_type] = i.total_available;
    });

    // 3. Compute deterministic allocation strictly server-side
    const deterministic = calculateDeterministicAllocations(
      planContext.zones,
      customInventoryMap
    );

    // 4. Gemini AI Explanation
    let strategicExplanation =
      'Tactical allocation concentrates high-mobility watercraft and emergency medical units in Rank #1 and #2 sectors due to catastrophic inundation and severed access corridors.';

    if (isGeminiConfigured()) {
      try {
        const ai = getGeminiClient();
        const promptText = `
You are an emergency operations coordinator.
Explain in 2-3 concise sentences why this resource allocation supports the current disaster response priorities.

CONSTRAINTS:
1. Do NOT alter any numbers or quantities.
2. Do NOT change risk scores or priority ranks.
3. Do NOT invent assets or operational conditions.

SUPPLIED ALLOCATION DATA:
- Incident: ${planContext.incident.name} (${planContext.incident.location_name})
- Total Assets Available: ${deterministic.totalAvailable}
- Total Assets Allocated: ${deterministic.totalAllocated}

ZONE ALLOCATION BREAKDOWN (Ranked Order):
${deterministic.zoneAllocations
  .map(
    (za) =>
      `Rank #${za.priority_rank} ${za.zone_code} (${za.zone_name}): Risk=${za.risk_score}/100, MedNeed=${za.medical_need}, Access=${za.accessibility}, Allocated=${za.total_allocated} units (Rescue=${za.rescue_teams}, Boats=${za.boats}, Med=${za.medical_units}, Amb=${za.ambulances}, Water=${za.water_units})`
  )
  .join('\n')}

Provide a concise, grounded explanation of why this distribution aligns with life-saving priorities.`;

        const geminiRes = await ai.models.generateContent({
          model: GEMINI_MODELS.REASONING,
          contents: promptText,
          config: {
            temperature: 0.2,
          },
        });

        const explanationText = geminiRes.text?.trim();
        if (explanationText && explanationText.length > 20) {
          strategicExplanation = explanationText;
        }
      } catch (geminiErr) {
        console.warn('[Allocations API] Gemini explanation failed, using fallback explanation:', geminiErr);
      }
    }

    // 5. Persist allocations into Supabase
    // Ensure an operational plan exists to link allocations to
    const allocationsToPersist = deterministic.zoneAllocations.map((za) => ({
      zone_id: za.zone_id,
      rescue_teams: za.rescue_teams,
      medical_units: za.medical_units,
      boats: za.boats,
      ambulances: za.ambulances,
      water_units: za.water_units,
      count: za.total_allocated,
    }));

    // Check if we have an existing plan or create one
    let targetPlanId: string | undefined;
    const existingMatrix = await getLatestAllocations(incident_id);
    if (existingMatrix?.plan_id) {
      targetPlanId = existingMatrix.plan_id;
      // Persist allocations directly via save_zone_allocations RPC
      const saveRes = await persistZoneAllocations(targetPlanId, allocationsToPersist);
      if (!saveRes.success) {
        console.warn('[Allocations API] Allocation update failed:', saveRes.error);
      }
    } else {
      // Create new plan and allocations atomically via create_operational_response_plan RPC
      const planRes = await persistResponsePlan({
        incidentId: planContext.incident.id,
        title: `Resource Allocation Directive // ${planContext.incident.name}`,
        summary: strategicExplanation,
        status: 'ACTIVE',
        allocations: allocationsToPersist,
      });
      targetPlanId = planRes.plan_id;
    }

    const latencyMs = Date.now() - startTime;

    const payload: ResourceMatrixPayload = {
      incident_id: planContext.incident.id,
      incident_name: planContext.incident.name,
      inventory_type: 'SIMULATED DEMO INVENTORY',
      inventory: deterministic.inventory,
      zone_allocations: deterministic.zoneAllocations,
      strategic_explanation: strategicExplanation,
      total_inventory: deterministic.totalAvailable,
      total_allocated: deterministic.totalAllocated,
      persisted: true,
      plan_id: targetPlanId,
    };

    setLatestAllocationsCache(payload);

    // Record real audit trail event
    recordAuditEvent({
      incident_id: planContext.incident.id,
      plan_id: targetPlanId,
      zone_code: deterministic.zoneAllocations[0]?.zone_code,
      event_type: 'RESOURCE_ALLOCATION_GENERATED',
      event_name: 'Deterministic Resource Matrix Allocated',
      description: `Allocated ${deterministic.totalAllocated} / ${deterministic.totalAvailable} emergency assets across ${deterministic.zoneAllocations.length} sectors. ${deterministic.zoneAllocations[0]?.zone_code || 'F-03'} (Priority #1) received primary allocation of ${deterministic.zoneAllocations[0]?.total_allocated ?? 0} units.`,
      source: 'RESOURCE_ALLOCATION_ENGINE',
      metadata: {
        total_allocated: deterministic.totalAllocated,
        total_available: deterministic.totalAvailable,
        zones_count: deterministic.zoneAllocations.length,
      },
    }).catch((err) => console.warn('[Audit] Failed to log allocation event:', err));

    const response: AllocationsApiResponse = {
      status: 'ok',
      data: payload,
      latencyMs,
      timestamp,
    };

    return NextResponse.json(response);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown resource allocation error',
        latencyMs,
        timestamp,
      },
      { status: 500 }
    );
  }
}

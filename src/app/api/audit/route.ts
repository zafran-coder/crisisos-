import { NextRequest, NextResponse } from 'next/server';
import { getAuditTrail, recordAuditEvent } from '@/lib/data-access/audit';
import { AuditApiResponse, AuditEventType, AuditSource } from '@/types/audit';

/**
 * GET /api/audit
 * Retrieves complete evidence audit trail and top-zone decision explainability dossier.
 */
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();

  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incident_id') || undefined;

    const payload = await getAuditTrail(incidentId);

    const response: AuditApiResponse = {
      status: 'ok',
      data: payload,
      timestamp,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Audit API] Error retrieving audit trail:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve evidence audit trail',
        timestamp,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit
 * Records a real operational system event into the audit trail and Supabase.
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json().catch(() => ({}));
    const {
      incident_id,
      zone_code,
      zone_id,
      plan_id,
      event_type,
      event_name,
      description,
      source,
      metadata,
    } = body;

    if (!event_type || !event_name || !description) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required event fields: event_type, event_name, description',
          timestamp,
        },
        { status: 400 }
      );
    }

    const result = await recordAuditEvent({
      incident_id,
      zone_code,
      zone_id,
      plan_id,
      event_type: event_type as AuditEventType,
      event_name,
      description,
      source: (source as AuditSource) || 'OPERATOR_CONSOLE',
      metadata,
    });

    return NextResponse.json({
      status: 'ok',
      data: result,
      timestamp,
    });
  } catch (error) {
    console.error('[Audit API] Error recording audit event:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to record audit event',
        timestamp,
      },
      { status: 500 }
    );
  }
}

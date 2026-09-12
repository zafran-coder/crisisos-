import { NextRequest, NextResponse } from 'next/server';
import { getEmergencyGuidelines } from '@/lib/data-access/guidelines';
import { recordAuditEvent } from '@/lib/data-access/audit';

/**
 * Endpoint for Emergency Guidelines RAG retrieval.
 * Returns grounded guidelines from Supabase or verified protocols.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { category, query = 'water rescue and structural collapse' } = body;

    const { guidelines, source, error } = await getEmergencyGuidelines(category);

    // Record audit event asynchronously (non-blocking)
    recordAuditEvent({
      event_type: 'RAG_GUIDANCE_GENERATED',
      event_name: 'Emergency Guidelines RAG Ingestion',
      description: `Retrieved ${guidelines.length} operational guideline protocols for query "${query}". Grounded in verified emergency protocols.`,
      source: 'PGVECTOR_RAG',
      metadata: {
        category,
        query,
        count: guidelines.length,
        protocols: guidelines.map((g) => g.protocol_code || g.title),
      },
    }).catch((err) => console.warn('[Audit] Failed to log RAG event:', err));

    return NextResponse.json({
      status: 'ok',
      source,
      query,
      count: guidelines.length,
      matchedGuidelines: guidelines,
      warning: error,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Invalid request payload',
      },
      { status: 400 }
    );
  }
}

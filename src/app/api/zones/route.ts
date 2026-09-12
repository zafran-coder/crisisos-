import { NextResponse } from 'next/server';
import { getZones } from '@/lib/data-access/zones';
import { getActiveIncident } from '@/lib/data-access/incidents';

export async function GET() {
  try {
    const [{ zones, source, error: zonesError }, { incident, error: incidentError }] =
      await Promise.all([getZones(), getActiveIncident()]);

    return NextResponse.json({
      status: 'ok',
      source,
      incident,
      count: zones.length,
      zones,
      warnings: [zonesError, incidentError].filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error fetching operational zones',
      },
      { status: 500 }
    );
  }
}

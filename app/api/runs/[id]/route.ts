import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * GET /api/runs/[id]
 * Get run details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    const run = await agentClient.getRun(id, token);
    return NextResponse.json(run);
  } catch (error: any) {
    console.error('[API] Failed to get run:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get run' },
      { status: error.statusCode || 500 }
    );
  }
}

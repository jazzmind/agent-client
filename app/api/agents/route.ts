import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';
import { handleAPIResponse } from '@/lib/error-handler';

/**
 * GET /api/agents
 * List all available agents
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const agents = await agentClient.listAgents(token);
    return NextResponse.json(agents);
  } catch (error: any) {
    console.error('[API] Failed to list agents:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || 'Failed to list agents' },
      { status: error.statusCode || 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

/**
 * GET /api/agents
 * List all available agents
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and exchange token
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }
    
    // Call agent-server with the authz token
    const agents = await agentClient.listAgents(auth.agentApiToken);
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

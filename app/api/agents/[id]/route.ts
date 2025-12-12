import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * GET /api/agents/[id]
 * Get agent details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    
    // Note: agent-server doesn't have individual GET endpoint yet
    // So we list all and filter (or this will be added in agent-server-requirements.md)
    const agents = await agentClient.listAgents(token);
    const agent = agents.find((a: any) => a.id === params.id);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(agent);
  } catch (error: any) {
    console.error('[API] Failed to get agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get agent' },
      { status: error.statusCode || 500 }
    );
  }
}

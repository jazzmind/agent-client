import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/auth-helper';
import { getAgentApiUrl } from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

const AGENT_API_URL = getAgentApiUrl();

/**
 * GET /api/tasks/[id]/executions/[execId]
 * 
 * Fetch a single task execution by ID with full details.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; execId: string }> }
) {
  try {
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id, execId } = await params;
    const headers = getAuthHeaders(auth.agentApiToken);
    
    // Fetch the specific execution
    const response = await fetch(
      `${AGENT_API_URL}/tasks/${id}/executions/${execId}`,
      { headers }
    );
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch execution', detail: error },
        { status: response.status }
      );
    }
    
    const execution = await response.json();
    
    // If execution has a run_id, fetch run details too
    if (execution.run_id) {
      try {
        const runResponse = await fetch(
          `${AGENT_API_URL}/runs/${execution.run_id}`,
          { headers }
        );
        
        if (runResponse.ok) {
          const runDetails = await runResponse.json();
          execution.run_details = runDetails;
        }
      } catch (err) {
        console.error('Failed to fetch run details:', err);
        // Continue without run details
      }
    }
    
    return NextResponse.json(execution);
  } catch (error) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

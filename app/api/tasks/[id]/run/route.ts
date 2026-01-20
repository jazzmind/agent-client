import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/auth-helper';
import { getAgentApiUrl } from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

const AGENT_API_URL = getAgentApiUrl();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id } = await params;
    const headers = getAuthHeaders(auth.agentApiToken);
    const body = await request.json().catch(() => ({}));
    
    const response = await fetch(`${AGENT_API_URL}/tasks/${id}/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: 'Failed to run task', detail: error.detail },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error running task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

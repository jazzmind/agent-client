import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/auth-helper';
import { getAgentApiUrl } from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

const AGENT_API_URL = getAgentApiUrl();

export async function GET(request: NextRequest) {
  try {
    // Authenticate and exchange token for agent-api access
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    const headers = getAuthHeaders(auth.agentApiToken);
    const { searchParams } = new URL(request.url);
    
    const response = await fetch(`${AGENT_API_URL}/tasks?${searchParams.toString()}`, {
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch tasks', detail: error },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and exchange token for agent-api access
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    const headers = getAuthHeaders(auth.agentApiToken);
    const body = await request.json();
    
    const response = await fetch(`${AGENT_API_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: 'Failed to create task', detail: error.detail },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getAuthHeaders } from '@/lib/auth-helper';

const baseUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://10.96.200.31:8000';

// Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const token = getTokenFromRequest(request);
    const authHeaders = getAuthHeaders(token);
    
    const response = await fetch(`${baseUrl}/agents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create agent: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}

// List agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const token = getTokenFromRequest(request);
    const authHeaders = getAuthHeaders(token);
    
    const response = await fetch(`${baseUrl}/agents${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch agents: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

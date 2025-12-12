import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';

// Get user token from request (assuming it's in cookies or headers)
function getTokenFromRequest(request: NextRequest): string | undefined {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie (if using httpOnly cookies)
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return undefined;
}

// List all agents
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const agents = await agentClient.listAgents(token);
    return NextResponse.json(agents);
  } catch (error: any) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// Create a new agent
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const body = await request.json();
    
    const agent = await agentClient.createAgentDefinition(body, token);
    return NextResponse.json(agent, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';

function getTokenFromRequest(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  return undefined;
}

// Update an agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const body = await request.json();
    
    const agent = await agentClient.updateAgentDefinition(params.id, body, token);
    return NextResponse.json(agent);
  } catch (error: any) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// Delete an agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    await agentClient.deleteAgent(params.id, token);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Failed to delete agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

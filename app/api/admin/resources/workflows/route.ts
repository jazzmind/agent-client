import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';

function getTokenFromRequest(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const tokenCookie = request.cookies.get('auth_token');
  return tokenCookie?.value;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const workflows = await agentClient.listWorkflows(token);
    return NextResponse.json(workflows);
  } catch (error: any) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const body = await request.json();
    const workflow = await agentClient.createWorkflow(body, token);
    return NextResponse.json(workflow, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

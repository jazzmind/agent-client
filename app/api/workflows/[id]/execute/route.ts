import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithTokenExchange } from '@/lib/auth-helpers';
import { agentClient } from '@/lib/agent-api-client';

// POST /api/workflows/[id]/execute - Execute a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthWithTokenExchange(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { input_data, guardrails } = body;

    const execution = await agentClient.executeWorkflow(
      params.id,
      input_data || {},
      guardrails,
      auth.agentApiToken
    );

    return NextResponse.json(execution);
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute workflow' },
      { status: error.status || 500 }
    );
  }
}

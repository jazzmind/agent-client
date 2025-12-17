import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithTokenExchange } from '@/lib/auth-helpers';
import { agentClient } from '@/lib/agent-api-client';

// GET /api/workflows/executions/[id]/steps - Get step executions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthWithTokenExchange(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const steps = await agentClient.getWorkflowExecutionSteps(params.id, auth.agentApiToken);
    return NextResponse.json(steps);
  } catch (error: any) {
    console.error('Error fetching execution steps:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch execution steps' },
      { status: error.status || 500 }
    );
  }
}

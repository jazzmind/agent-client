import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';
import { stopWorkflowExecution } from '@/lib/agent-api-client';

// POST /api/workflows/executions/[id]/stop - Stop a running execution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthWithTokenExchange(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const execution = await stopWorkflowExecution(id, auth.agentApiToken);
    return NextResponse.json(execution);
  } catch (error: any) {
    console.error('Error stopping execution:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop execution' },
      { status: error.status || 500 }
    );
  }
}

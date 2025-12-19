import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';
import { getWorkflowExecution } from '@/lib/agent-api-client';

// GET /api/workflows/executions/[id] - Get execution details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthWithTokenExchange(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const execution = await getWorkflowExecution(id, auth.agentApiToken);
    return NextResponse.json(execution);
  } catch (error: any) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch execution' },
      { status: error.status || 500 }
    );
  }
}

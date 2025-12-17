import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithTokenExchange } from '@/lib/auth-helpers';
import { agentClient } from '@/lib/agent-api-client';

// GET /api/workflows/[id]/executions - List executions for a workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthWithTokenExchange(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const status = searchParams.get('status') || undefined;

    const executions = await agentClient.listWorkflowExecutions(
      params.id,
      { limit, offset, status },
      auth.agentApiToken
    );

    return NextResponse.json(executions);
  } catch (error: any) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch executions' },
      { status: error.status || 500 }
    );
  }
}

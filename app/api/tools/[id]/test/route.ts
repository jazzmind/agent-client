import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

/**
 * POST /api/tools/[id]/test
 * Execute a tool with test input in sandbox mode
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and exchange token
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    const { id: toolId } = await params;
    const body = await request.json();

    if (!body.input || typeof body.input !== 'object') {
      return NextResponse.json(
        { error: 'Request body must include an "input" object' },
        { status: 400 }
      );
    }

    const result = await agentClient.testTool(toolId, body.input, auth.agentApiToken);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Tool test error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test tool' },
      { status: error.statusCode || 500 }
    );
  }
}

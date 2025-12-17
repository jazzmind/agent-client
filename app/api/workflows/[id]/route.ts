import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

/**
 * GET /api/workflows/[id]
 * Get a single workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) return auth; // Auth failed, return error response
    const workflow = await agentClient.getWorkflow(params.id, auth.agentApiToken);
    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error('[API] Failed to get workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get workflow' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/workflows/[id]
 * Update a workflow
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) return auth; // Auth failed, return error response
    const body = await request.json();
    
    const workflow = await agentClient.updateWorkflow(params.id, body, auth.agentApiToken);
    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error('[API] Failed to update workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update workflow' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) return auth; // Auth failed, return error response
    await agentClient.deleteWorkflow(params.id, auth.agentApiToken);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error: any) {
    console.error('[API] Failed to delete workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: error.statusCode || 500 }
    );
  }
}

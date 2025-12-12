import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * GET /api/conversations/[id]
 * Get conversation with messages from agent-server
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const conversation = await agentClient.getConversation(params.id, token);
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('[API] Get conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get conversation' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Delete conversation via agent-server
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await agentClient.deleteConversation(params.id, token);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('[API] Delete conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete conversation' },
      { status: error.statusCode || 500 }
    );
  }
}

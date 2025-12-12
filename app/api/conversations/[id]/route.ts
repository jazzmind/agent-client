import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserIdFromToken } from '@/lib/auth-helper';
import { db } from '@/lib/db';

/**
 * GET /api/conversations/[id]
 * Get conversation with all messages
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

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const conversation = await db.conversation.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversationId,
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments,
        run_id: msg.runId,
        routing_decision: msg.routingDecision,
        tool_calls: msg.toolCalls,
        created_at: msg.createdAt.toISOString(),
      })),
      created_at: conversation.createdAt.toISOString(),
      updated_at: conversation.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Failed to get conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Delete a conversation
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

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const conversation = await db.conversation.findUnique({
      where: { id: params.id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await db.conversation.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('[API] Failed to delete conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

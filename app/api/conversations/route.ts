import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserIdFromToken } from '@/lib/auth-helper';
import { db } from '@/lib/db';

/**
 * GET /api/conversations
 * List user's conversations
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conversations = await db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(
      conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        last_message: conv.messages[0] ? {
          role: conv.messages[0].role,
          content: conv.messages[0].content.substring(0, 100),
          created_at: conv.messages[0].createdAt.toISOString(),
        } : null,
        created_at: conv.createdAt.toISOString(),
        updated_at: conv.updatedAt.toISOString(),
      }))
    );
  } catch (error: any) {
    console.error('[API] Failed to list conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list conversations' },
      { status: 500 }
    );
  }
}

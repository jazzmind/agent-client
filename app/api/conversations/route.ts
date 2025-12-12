import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * GET /api/conversations
 * List user's conversations from agent-server
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

    const conversations = await agentClient.listConversations(token);
    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('[API] List conversations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list conversations' },
      { status: error.statusCode || 500 }
    );
  }
}

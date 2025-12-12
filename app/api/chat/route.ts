import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * POST /api/chat
 * Send a chat message and get response from dispatcher agent
 * 
 * This route:
 * 1. Receives user message and attachments
 * 2. Loads user's chat settings (enabled tools/agents)
 * 3. Calls dispatcher agent with settings
 * 4. Returns both user message and assistant response
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { conversation_id, message, attachments = [] } = body;

    // Load user's chat settings
    const settingsResponse = await fetch(`${request.nextUrl.origin}/api/chat/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    let settings = {
      enabled_tools: [],
      enabled_agents: [],
      model: undefined,
      temperature: 0.7,
      max_tokens: 2000,
    };

    if (settingsResponse.ok) {
      settings = await settingsResponse.json();
    }

    // Get or create conversation
    let conversation;
    if (conversation_id) {
      conversation = await db.conversation.findUnique({
        where: { id: conversation_id },
      });
      if (!conversation || conversation.userId !== userId) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation
      conversation = await db.conversation.create({
        data: {
          title: message.substring(0, 50),
          userId,
        },
      });
    }

    // Save user message to database
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        attachments: attachments.length > 0 ? attachments : null,
      },
    });

    // Call dispatcher agent
    // Note: This assumes dispatcher agent is implemented in agent-server (REQ-001)
    const run = await agentClient.createRun({
      agent_id: 'dispatcher', // Dispatcher agent ID
      input: {
        query: message,
        attachments,
        enabled_tools: settings.enabled_tools,
        enabled_agents: settings.enabled_agents,
        user_settings: settings,
      },
    }, token);

    // Create placeholder assistant message
    // This will be updated via SSE streaming
    const assistantMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: '', // Will be updated via streaming
        runId: run.id,
      },
    });

    // Update conversation updated_at
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Return immediately with run ID for SSE streaming
    return NextResponse.json({
      userMessage: {
        id: userMessage.id,
        conversation_id: conversation.id,
        role: userMessage.role,
        content: userMessage.content,
        attachments: userMessage.attachments,
        created_at: userMessage.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessage.id,
        conversation_id: conversation.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        run_id: run.id,
        created_at: assistantMessage.createdAt.toISOString(),
      },
      conversation: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.createdAt.toISOString(),
        updated_at: conversation.updatedAt.toISOString(),
      },
      runId: run.id, // Client should use this to stream updates
    });
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: error.statusCode || 500 }
    );
  }
}

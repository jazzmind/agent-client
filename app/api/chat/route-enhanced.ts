import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest, getUserIdFromToken } from '@/lib/auth-helper';
import { db } from '@/lib/db';

/**
 * POST /api/chat
 * Send a chat message with intelligent dispatcher routing
 * 
 * Flow:
 * 1. Save user message to database
 * 2. Load available tools and agents
 * 3. Call dispatcher to get routing decision
 * 4. If disambiguation needed, return routing options
 * 5. Otherwise, execute selected tools/agents
 * 6. Save assistant response
 * 7. Return messages with runId for streaming
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
    const { conversation_id, message, attachments = [], user_override = null } = body;

    // Load user's chat settings
    let settings = await db.chatSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.chatSettings.create({
        data: {
          userId,
          enabledTools: ['doc_search', 'web_search'],
          enabledAgents: [],
          temperature: 0.7,
          maxTokens: 2000,
        },
      });
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
      conversation = await db.conversation.create({
        data: {
          title: message.substring(0, 50),
          userId,
        },
      });
    }

    // Save user message
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        attachments: attachments.length > 0 ? attachments : null,
      },
    });

    // Load available tools and agents (filtered by user settings)
    const [allTools, allAgents] = await Promise.all([
      agentClient.listTools(token),
      agentClient.listAgents(token),
    ]);

    // Filter by enabled settings
    const availableTools = allTools
      .filter((t: any) => settings!.enabledTools.includes(t.name))
      .map((t: any) => ({
        name: t.name,
        description: t.description || '',
      }));

    const availableAgents = allAgents
      .filter((a: any) => settings!.enabledAgents.includes(a.id))
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
      }));

    // Call dispatcher (unless user provided override)
    let routingDecision;
    
    if (user_override) {
      // User explicitly selected tools/agents
      routingDecision = {
        selected_tools: user_override.tools || [],
        selected_agents: user_override.agents || [],
        confidence: 1.0,
        reasoning: 'User override',
        alternatives: [],
        requires_disambiguation: false,
      };
    } else {
      // Let dispatcher decide
      routingDecision = await agentClient.routeQuery({
        query: message,
        available_tools: availableTools,
        available_agents: availableAgents,
        attachments,
        user_settings: {
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          model: settings.model,
        },
      }, token);
    }

    // Check if disambiguation is needed
    if (routingDecision.requires_disambiguation) {
      // Return routing options for user to choose
      return NextResponse.json({
        requires_disambiguation: true,
        routing_decision: routingDecision,
        userMessage: {
          id: userMessage.id,
          conversation_id: conversation.id,
          role: userMessage.role,
          content: userMessage.content,
          attachments: userMessage.attachments,
          created_at: userMessage.createdAt.toISOString(),
        },
      });
    }

    // Execute the routing decision
    // For now, we'll create a single run with the dispatcher's decision
    // In the future, this could execute multiple tools/agents in parallel
    
    let runId: string | null = null;
    let responseContent = '';

    if (routingDecision.selected_tools.length > 0 || routingDecision.selected_agents.length > 0) {
      // Execute via an agent that uses the selected tools
      // For now, use a generic "executor" agent or the first selected agent
      const agentId = routingDecision.selected_agents[0] || 'chat-assistant';
      
      const run = await agentClient.createRun({
        agent_id: agentId,
        input: {
          query: message,
          attachments,
          selected_tools: routingDecision.selected_tools,
        },
      }, token);

      runId = run.id;
      responseContent = 'Processing your request...';
    } else {
      // No tools/agents selected - direct response
      responseContent = 'I\'m not sure how to help with that. Could you rephrase your question?';
    }

    // Create assistant message
    const assistantMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: responseContent,
        runId,
        routingDecision: routingDecision as any,
      },
    });

    // Update conversation
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

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
        run_id: runId,
        routing_decision: routingDecision,
        created_at: assistantMessage.createdAt.toISOString(),
      },
      conversation: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.createdAt.toISOString(),
        updated_at: conversation.updatedAt.toISOString(),
      },
      runId, // For SSE streaming
      requires_disambiguation: false,
    });
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: error.statusCode || 500 }
    );
  }
}

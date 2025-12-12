import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest, getUserIdFromToken } from '@/lib/auth-helper';

/**
 * POST /api/chat
 * Send a chat message with intelligent dispatcher routing
 * 
 * Flow:
 * 1. Get or create conversation via agent-server
 * 2. Save user message via agent-server
 * 3. Load available tools and agents
 * 4. Get user's chat settings
 * 5. Call dispatcher to get routing decision
 * 6. If disambiguation needed, return routing options
 * 7. Otherwise, execute selected tools/agents
 * 8. Save assistant response via agent-server
 * 9. Return messages with runId for streaming
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

    // Get or create conversation via agent-server
    let conversation;
    if (conversation_id) {
      conversation = await agentClient.getConversation(conversation_id, token);
    } else {
      conversation = await agentClient.createConversation(
        { title: message.substring(0, 50) },
        token
      );
    }

    // Save user message via agent-server
    const userMessage = await agentClient.createMessage(
      conversation.id,
      {
        role: 'user',
        content: message,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      token
    );

    // Get user's chat settings from agent-server
    const settings = await agentClient.getChatSettings(token);

    // Load available tools and agents (filtered by user settings)
    const [allTools, allAgents] = await Promise.all([
      agentClient.listTools(token),
      agentClient.listAgents(token),
    ]);

    // Filter by enabled settings
    const availableTools = allTools
      .filter((t: any) => settings.enabled_tools.includes(t.name))
      .map((t: any) => ({
        name: t.name,
        description: t.description || '',
      }));

    const availableAgents = allAgents
      .filter((a: any) => settings.enabled_agents.includes(a.id))
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
          max_tokens: settings.max_tokens,
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
          created_at: userMessage.created_at,
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
          conversation_id: conversation.id,
        },
      }, token);

      runId = run.id;
      responseContent = 'Processing your request...';
    } else {
      // No tools/agents selected - direct response
      responseContent = 'I\'m not sure how to help with that. Could you rephrase your question?';
    }

    // Create assistant message via agent-server
    const assistantMessage = await agentClient.createMessage(
      conversation.id,
      {
        role: 'assistant',
        content: responseContent,
        run_id: runId || undefined,
        routing_decision: routingDecision,
      },
      token
    );

    return NextResponse.json({
      userMessage: {
        id: userMessage.id,
        conversation_id: conversation.id,
        role: userMessage.role,
        content: userMessage.content,
        attachments: userMessage.attachments,
        created_at: userMessage.created_at,
      },
      assistantMessage: {
        id: assistantMessage.id,
        conversation_id: conversation.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        run_id: runId,
        routing_decision: routingDecision,
        created_at: assistantMessage.created_at,
      },
      conversation: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
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

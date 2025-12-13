import { NextRequest } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest, getUserIdFromToken } from '@/lib/auth-helper';

/**
 * POST /api/chat
 * Streaming chat endpoint used by @jazzmind/busibox-app `ChatInterface`.
 *
 * Request body (library contract):
 * - messages: Array<{ role: 'user'|'assistant'|'system', content: string }>
 * - model?: string
 *
 * Response:
 * - text/plain streamed response containing the assistant's final message.
 */
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const modelOverride = typeof body?.model === 'string' ? body.model : undefined;

    const lastUser = [...messages].reverse().find((m: any) => m?.role === 'user' && typeof m?.content === 'string');
    const prompt = (lastUser?.content ?? '').trim();
    if (!prompt) {
      return new Response('Please enter a message.', { status: 400 });
    }

    // Settings still control tool/agent routing (even though the UI is simplified).
    const settings = await agentClient.getChatSettings(token);
    const [allTools, allAgents] = await Promise.all([agentClient.listTools(token), agentClient.listAgents(token)]);

    const availableTools = allTools
      .filter((t: any) => settings.enabled_tools.includes(t.name))
      .map((t: any) => ({ name: t.name, description: t.description || '' }));

    const availableAgents = allAgents
      .filter((a: any) => settings.enabled_agents.includes(a.id))
      .map((a: any) => ({ id: a.id, name: a.name, description: a.description || '' }));

    const routingDecision = await agentClient.routeQuery(
      {
        query: prompt,
        available_tools: availableTools,
        available_agents: availableAgents,
        user_settings: {
          temperature: settings.temperature,
          max_tokens: settings.max_tokens,
          model: modelOverride || settings.model,
        },
      },
      token
    );

    const agentId = routingDecision.selected_agents[0] || 'chat-assistant';
    const run = await agentClient.createRun(
      {
        agent_id: agentId,
        input: {
          query: prompt,
          selected_tools: routingDecision.selected_tools,
        },
      },
      token
    );

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const sseRes = await agentClient.getRunStreamResponse(run.id, token);
          const reader = sseRes.body?.getReader();
          if (!reader) {
            controller.enqueue(encoder.encode('❌ Error: No stream available.\n'));
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';
          let finished = false;

          while (!finished) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // SSE events are separated by a blank line
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';

            for (const rawEvent of parts) {
              const lines = rawEvent.split('\n').map((l) => l.trim());
              const eventLine = lines.find((l) => l.startsWith('event:'));
              const dataLine = lines.find((l) => l.startsWith('data:'));
              const eventType = eventLine ? eventLine.split(':', 2)[1].trim() : '';
              const dataStr = dataLine ? dataLine.slice('data:'.length).trim() : '';

              if (eventType === 'output' && dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  const msg = typeof data?.message === 'string' ? data.message : JSON.stringify(data);
                  controller.enqueue(encoder.encode(msg));
                } catch {
                  controller.enqueue(encoder.encode(dataStr));
                }
                finished = true;
                break;
              }

              if (eventType === 'error' && dataStr) {
                controller.enqueue(encoder.encode(`❌ Error: ${dataStr}`));
                finished = true;
                break;
              }

              if (eventType === 'complete') {
                // If the run completes without an output payload, end cleanly.
                finished = true;
                break;
              }
            }
          }
        } catch (err: any) {
          controller.enqueue(encoder.encode(`❌ Error: ${err?.message || 'Failed to stream response'}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to process chat message' }), {
      status: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

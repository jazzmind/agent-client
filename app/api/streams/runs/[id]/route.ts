import { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-helper';

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://10.96.200.202:8000';

/**
 * GET /api/streams/runs/[id]
 * Server-Sent Events stream for run updates
 * 
 * This route proxies SSE from the agent-server, adding authentication
 * and handling CORS/connection management.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;

  try {
    // Get authentication token
    const token = getTokenFromRequest(request);
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Connect to agent-server SSE endpoint
    const sseUrl = `${AGENT_API_URL}/streams/runs/${runId}`;
    const response = await fetch(sseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SSE Proxy] Agent-server error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Failed to connect to run stream: ${response.statusText}`,
          details: errorText,
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return SSE stream with proper headers
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error: any) {
    console.error('[SSE Proxy] Failed to establish stream:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to establish stream connection',
        details: error.message,
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

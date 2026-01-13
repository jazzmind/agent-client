import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

/**
 * GET /api/tools
 * List all tools
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and exchange token
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }
    
    // Call agent-server with the authz token
    const tools = await agentClient.listTools(auth.agentApiToken);
    return NextResponse.json(tools);
  } catch (error: any) {
    console.error('[API] Failed to list tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list tools' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * POST /api/tools
 * Create a new tool
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and exchange token
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }
    
    const body = await request.json();
    
    const tool = await agentClient.createTool(body, auth.agentApiToken);
    return NextResponse.json(tool, { status: 201 });
  } catch (error: any) {
    console.error('[API] Failed to create tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tool' },
      { status: error.statusCode || 500 }
    );
  }
}

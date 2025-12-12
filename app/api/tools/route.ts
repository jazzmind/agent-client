import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * GET /api/tools
 * List all tools
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const tools = await agentClient.listTools(token);
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
    const token = getTokenFromRequest(request);
    const body = await request.json();
    
    const tool = await agentClient.createTool(body, token);
    return NextResponse.json(tool, { status: 201 });
  } catch (error: any) {
    console.error('[API] Failed to create tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tool' },
      { status: error.statusCode || 500 }
    );
  }
}

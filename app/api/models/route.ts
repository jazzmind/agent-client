import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { getTokenFromRequest } from '@/lib/auth-helper';

/**
 * GET /api/models
 * List available LLM models
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const models = await agentClient.listModels(token);
    return NextResponse.json(models);
  } catch (error: any) {
    console.error('[API] Failed to list models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list models' },
      { status: error.statusCode || 500 }
    );
  }
}

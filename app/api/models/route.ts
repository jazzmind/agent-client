import { NextRequest, NextResponse } from 'next/server';
import * as agentClient from '@/lib/agent-api-client';
import { requireAuthWithTokenExchange } from '@/lib/auth-middleware';

/**
 * GET /api/models
 * List available LLM models
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and exchange token
    const auth = await requireAuthWithTokenExchange(request);
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }
    
    const models = await agentClient.listModels(auth.agentApiToken);
    return NextResponse.json(models);
  } catch (error: any) {
    console.error('[API] Failed to list models:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || 'Failed to list models' },
      { status: 500 }
    );
  }
}

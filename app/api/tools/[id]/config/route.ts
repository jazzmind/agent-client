/**
 * Tool Configuration API Route
 * 
 * GET/PUT /api/tools/[id]/config - Get or update tool configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-helper';

// In-memory store for tool configurations (in production, this would be in a database)
const toolConfigs = new Map<string, any>();

/**
 * GET /api/tools/[id]/config
 * Get configuration for a specific tool
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const config = toolConfigs.get(params.id);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('[API] Failed to get tool config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tool configuration' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/tools/[id]/config
 * Update configuration for a specific tool
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate configuration structure
    if (body.providers) {
      for (const [provider, config] of Object.entries(body.providers)) {
        if (typeof config !== 'object') {
          return NextResponse.json(
            { error: `Invalid configuration for provider: ${provider}` },
            { status: 400 }
          );
        }
      }
    }

    // Store configuration
    toolConfigs.set(params.id, body);

    // In production, you would:
    // 1. Store this in a database
    // 2. Notify the agent-server about the configuration change
    // 3. Validate API keys with the respective services
    // 4. Handle encryption of sensitive data

    return NextResponse.json({ 
      success: true,
      message: 'Configuration updated successfully',
      config: body
    });
  } catch (error: any) {
    console.error('[API] Failed to update tool config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tool configuration' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/tools/[id]/config
 * Delete configuration for a specific tool
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    toolConfigs.delete(params.id);

    return NextResponse.json({ 
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error: any) {
    console.error('[API] Failed to delete tool config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tool configuration' },
      { status: error.statusCode || 500 }
    );
  }
}

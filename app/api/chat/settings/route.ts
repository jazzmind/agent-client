import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserIdFromToken } from '@/lib/auth-helper';
import { db } from '@/lib/db';

/**
 * GET /api/chat/settings
 * Get user's chat settings
 */
export async function GET(request: NextRequest) {
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

    // Load from database or create default
    let settings = await db.chatSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings
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

    return NextResponse.json({
      enabled_tools: settings.enabledTools,
      enabled_agents: settings.enabledAgents,
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });
  } catch (error: any) {
    console.error('[API] Failed to get chat settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get chat settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chat/settings
 * Update user's chat settings
 */
export async function PUT(request: NextRequest) {
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

    // Upsert settings
    const settings = await db.chatSettings.upsert({
      where: { userId },
      update: {
        enabledTools: body.enabled_tools || [],
        enabledAgents: body.enabled_agents || [],
        model: body.model || null,
        temperature: body.temperature ?? 0.7,
        maxTokens: body.max_tokens ?? 2000,
      },
      create: {
        userId,
        enabledTools: body.enabled_tools || [],
        enabledAgents: body.enabled_agents || [],
        model: body.model || null,
        temperature: body.temperature ?? 0.7,
        maxTokens: body.max_tokens ?? 2000,
      },
    });

    return NextResponse.json({
      enabled_tools: settings.enabledTools,
      enabled_agents: settings.enabledAgents,
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });
  } catch (error: any) {
    console.error('[API] Failed to update chat settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update chat settings' },
      { status: 500 }
    );
  }
}

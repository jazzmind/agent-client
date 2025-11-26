import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../../lib/oauth-client.js';

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID and secret are required' },
        { status: 400 }
      );
    }

    // Test authentication by requesting a token
    const accessToken = await getAccessToken({
      clientId,
      clientSecret,
      service: 'agent',  // Use agent service for full capabilities
      scope: 'agent.read agent.execute workflow.execute tool.execute', // Request common scopes
    });

    // Decode token to get scopes (in a real implementation, you'd validate the JWT)
    // For now, we'll return the scopes we requested
    const scopes = ['agent.read', 'agent.execute', 'workflow.execute', 'tool.execute'];

    return NextResponse.json({
      success: true,
      accessToken,
      scopes,
      clientId,
    });

  } catch (error: any) {
    console.error('Authentication failed:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Authentication failed',
        success: false 
      },
      { status: 401 }
    );
  }
}

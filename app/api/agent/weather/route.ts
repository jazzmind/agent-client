import { NextRequest, NextResponse } from 'next/server';
import { getAdminIdentity } from '../../../../lib/admin-auth';

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://10.96.201.202:4111';

/**
 * Query the weather agent
 * This endpoint proxies requests to the Python agent-server with proper authentication
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get authenticated token from admin identity
    const identity = await getAdminIdentity();
    
    // Check if user has weather role/scope
    const hasWeatherAccess = identity.scopes.some(scope => 
      scope.includes('weather') || scope.includes('admin') || scope.includes('agent')
    );

    if (!hasWeatherAccess) {
      return NextResponse.json(
        { 
          error: 'Access denied. Weather functionality requires the "weather" role.',
          requiredScopes: ['weather.read', 'agent.execute'],
          userScopes: identity.scopes
        },
        { status: 403 }
      );
    }

    // Forward request to agent-server with auth token
    const response = await fetch(`${AGENT_API_URL}/agents/weather/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${identity.token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { 
          error: errorData.error || errorData.detail || 'Failed to query weather agent',
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      ...data,
      success: true,
      clientId: identity.clientId,
      scopes: identity.scopes,
    });

  } catch (error: any) {
    console.error('Error querying weather agent:', error);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('403')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed. Please check credentials.',
          success: false
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to communicate with agent service',
        success: false,
        details: error.message
      },
      { status: 500 }
    );
  }
}


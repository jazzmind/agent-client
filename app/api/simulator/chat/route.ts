import { NextRequest, NextResponse } from 'next/server';
import { MastraClient } from "@mastra/client-js";

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { agentId, messages } = await request.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Agent ID and messages array are required' },
        { status: 400 }
      );
    }

    // Create authenticated Mastra client
    const mastraClient = new MastraClient({
      baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    try {
      // Get the specified agent
      const agent = mastraClient.getAgent(agentId);
      
      // Generate response from the agent
      const response = await agent.generateVNext(
        messages // Messages array directly
      );

      return NextResponse.json({
        text: response.text || 'Sorry, I couldn\'t process that request.',
        success: true,
        agentId,
      });

    } catch (mastraError: any) {
      console.error('Mastra client error:', mastraError);
      
      // Fallback: try direct API call to the agent server
      const response = await fetch(`${baseUrl}/admin/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Agent server error: ${response.status} ${errorData}`);
      }

      const data = await response.json();

      return NextResponse.json({
        text: data.text || data.response || 'Sorry, I couldn\'t process that request.',
        success: true,
        agentId,
      });
    }

  } catch (error: any) {
    console.error('Error communicating with agent:', error);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed. Please check your credentials.',
          success: false
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to communicate with agent',
        success: false,
        details: error.message
      },
      { status: 500 }
    );
  }
}

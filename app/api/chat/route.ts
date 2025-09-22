import { NextRequest, NextResponse } from 'next/server';
import { MastraClient } from "@mastra/client-js";
import { getAuthHeaders } from '../../../lib/oauth-client.js';

// Server-side Mastra client
const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

console.log('Mastra API URL:', baseUrl);

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get authenticated headers using OAuth 2.0 client credentials
    const authHeaders = await getAuthHeaders();
    console.log('Using OAuth 2.0 authentication');

    // Create authenticated Mastra client
    const mastraClient = new MastraClient({
      baseUrl,
      headers: authHeaders
    });

    // Get the weather agent from the Mastra server
    const agent = mastraClient.getAgent('weatherAgent');
    
    // Generate response from the agent using the correct VNext API signature
    const response = await agent.generateVNext(
      messages // First parameter: messages array directly
      // Using default options for now
    );

    return NextResponse.json({
      text: response.text || 'Sorry, I couldn\'t process that request.',
      success: true
    });

  } catch (error: any) {
    console.error('Error communicating with weather agent:', error);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('invalid_client')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed. Please check client credentials.',
          success: false
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to communicate with weather service',
        success: false,
        details: error.message
      },
      { status: 500 }
    );
  }
}

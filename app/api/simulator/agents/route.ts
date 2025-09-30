import { NextRequest, NextResponse } from 'next/server';
import { MastraClient } from "@mastra/client-js";

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create authenticated Mastra client
    const mastraClient = new MastraClient({
      baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    try {
      // Get available agents from Mastra server
      const agentsData = await (mastraClient as any).getAgents();
      
      // Transform the agents data into our expected format
      const agents = Object.entries(agentsData || {}).map(([key, value]: [string, any]) => ({
        id: key,
        name: key,
        displayName: value.name || key,
        description: value.instructions?.substring(0, 200) + '...' || 'No description available',
        scopes: ['agent.read', 'agent.execute'], // Default scopes for agents
      }));

      return NextResponse.json({
        success: true,
        agents,
      });

    } catch (mastraError: any) {
      console.error('Mastra client error:', mastraError);
      
      // Fallback to direct API call if Mastra client fails
      const response = await fetch(`${baseUrl}/admin/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const agentsData = await response.json();
      
      // Transform the agents data
      const agents = Object.entries(agentsData || {}).map(([key, value]: [string, any]) => ({
        id: key,
        name: key,
        displayName: value.name || key,
        description: value.instructions?.substring(0, 200) + '...' || 'No description available',
        scopes: ['agent.read', 'agent.execute'], // Default scopes for agents
      }));

      return NextResponse.json({
        success: true,
        agents,
      });
    }

  } catch (error: any) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch agents',
        success: false 
      },
      { status: 500 }
    );
  }
}

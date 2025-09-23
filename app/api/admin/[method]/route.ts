import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders, getAdminMastraClient } from '../../../../lib/admin-auth';

const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET(request: NextRequest, { params }: { params: Promise<{ method: string }> }) {
  try {
    const { method } = await params;
    console.log('method', method);
    // Try MastraClient first, with fallback to direct fetch
    try {
      const mastraClient = await getAdminMastraClient();
      
      // Handle each method explicitly to avoid TypeScript issues
      let result;
      switch (method) {
        case 'agents':
          result = await (mastraClient as any).getAgents();
          break;
        case 'workflows':
          result = await (mastraClient as any).getWorkflows();
          break;
        case 'tools':
          result = await (mastraClient as any).getTools();
          break;
        case 'clients':
          result = await (mastraClient as any).getClients();
          break;
        case 'scorers':
          result = await (mastraClient as any).getScorers();
          break;
        default:
          result = null;
      }
      
      if (result) {
        console.log('result', result);
        return NextResponse.json(result);
      }
      console.log('failed');
    } catch (error) {
      console.log(`MastraClient method failed for ${method}, falling back to fetch:`, error);
    }
    // Fallback to direct fetch for unsupported methods like scorers
    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/${method}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to list:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ method: string }> }) {
  try {
    const { method } = await params;
    const methodData = await request.json();
    
    // Try MastraClient first, with fallback to direct fetch
    try {
      const mastraClient = await getAdminMastraClient();
      
      // Handle each method explicitly to avoid TypeScript issues
      let result;
      switch (method) {
        case 'agents':
          result = await (mastraClient as any).createAgent(methodData);
          break;
        case 'workflows':
          result = await (mastraClient as any).createWorkflow(methodData);
          break;
        case 'tools':
          result = await (mastraClient as any).createTool(methodData);
          break;
        case 'clients':
          result = await (mastraClient as any).createClient(methodData);
          break;
        case 'scorers':
          // Scorers likely not supported in MastraClient yet, will fall through to fetch
          result = null;
          break;
        default:
          result = null;
      }
      
      if (result) {
        return NextResponse.json(result);
      }
    } catch (error) {
      console.log(`MastraClient create method failed for ${method}, falling back to fetch:`, error);
    }
    
    // Fallback to direct fetch
    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/${method}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(methodData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create' },
      { status: 500 }
    );
  }
}

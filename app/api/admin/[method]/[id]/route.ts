import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders, getAdminMastraClient } from '../../../../../lib/admin-auth';

const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ method: string, id: string }> }
) {
  try {
    const { method, id } = await params;
    
    // Try MastraClient first, with fallback to direct fetch
    try {
      const mastraClient = await getAdminMastraClient();
      
      // Handle each method explicitly to avoid TypeScript issues
      let result;
      switch (method) {
        case 'agents':
          result = await (mastraClient as any).getAgent(id);
          break;
        case 'workflows':
          result = await (mastraClient as any).getWorkflow(id);
          break;
        case 'tools':
          result = await (mastraClient as any).getTool(id);
          break;
        case 'clients':
          result = await (mastraClient as any).getClient(id);
          break;
        case 'scorers':
          result = await (mastraClient as any).getScorer(id);
          break;
        default:
          result = null;
      }
      
      if (result) {
        return NextResponse.json(result);
      }
    } catch (error) {
      console.log(`MastraClient get method failed for ${method}/${id}, falling back to fetch:`, error);
    }
    
    // Fallback to direct fetch
    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/${method}/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get' },
      { status: 500 }
    );
  }
} 

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ method: string, id: string }> }
) {
  try {
    const { method, id } = await params;
    const methodData = await request.json();
    
    // Try MastraClient first, with fallback to direct fetch
    try {
      const mastraClient = await getAdminMastraClient();
      
      // Handle each method explicitly to avoid TypeScript issues
      let result;
      switch (method) {
        case 'agents':
          result = await (mastraClient as any).updateAgent(id, methodData);
          break;
        case 'workflows':
          result = await (mastraClient as any).updateWorkflow(id, methodData);
          break;
        case 'tools':
          result = await (mastraClient as any).updateTool(id, methodData);
          break;
        case 'clients':
          result = await (mastraClient as any).updateClient(id, methodData);
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
      console.log(`MastraClient update method failed for ${method}/${id}, falling back to fetch:`, error);
    }
    
    // Fallback to direct fetch
    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/${method}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(methodData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ method: string, id: string }> }
) {
  try {
    const { method, id } = await params;
    const methodData = await request.json();
    
    // Try MastraClient first, with fallback to direct fetch
    try {
      const mastraClient = await getAdminMastraClient();
      
      // Handle each method explicitly to avoid TypeScript issues
      let result;
      switch (method) {
        case 'agents':
          result = await (mastraClient as any).patchAgent(id, methodData);
          break;
        case 'workflows':
          result = await (mastraClient as any).patchWorkflow(id, methodData);
          break;
        case 'tools':
          result = await (mastraClient as any).patchTool(id, methodData);
          break;
        case 'clients':
          result = await (mastraClient as any).patchClient(id, methodData);
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
      console.log(`MastraClient patch method failed for ${method}/${id}, falling back to fetch:`, error);
    }
    
    // Fallback to direct fetch
    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/${method}/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(methodData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to patch:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to patch' },
      { status: 500 }
    );
  }
} 

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ method: string, id: string }> }
) {
  try {
    const { method, id } = await params;
    
    // Try MastraClient first, with fallback to direct fetch
    try {
      const mastraClient = await getAdminMastraClient();
      
      // Handle each method explicitly to avoid TypeScript issues
      let result;
      switch (method) {
        case 'agents':
          result = await (mastraClient as any).deleteAgent(id);
          break;
        case 'workflows':
          result = await (mastraClient as any).deleteWorkflow(id);
          break;
        case 'tools':
          result = await (mastraClient as any).deleteTool(id);
          break;
        case 'clients':
          result = await (mastraClient as any).deleteClient(id);
          break;
        case 'scorers':
          // Scorers likely not supported in MastraClient yet, will fall through to fetch
          result = null;
          break;
        default:
          result = null;
      }
      
      if (result !== null) {
        return NextResponse.json(result);
      }
    } catch (error) {
      console.log(`MastraClient delete method failed for ${method}/${id}, falling back to fetch:`, error);
    }
    
    // Fallback to direct fetch
    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/${method}/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to delete:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete' },
      { status: 500 }
    );
  }
}

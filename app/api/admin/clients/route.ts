import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '../../../../lib/admin-auth';

const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';
export async function GET() {
  try {
    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/servers`, {
      method: 'GET',
      headers,
    });
    const clients = await response.json();
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Failed to list clients:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientData = await request.json();
    
    // Validate required fields
    if (!clientData.serverId || !clientData.name) {
      return NextResponse.json(
        { error: 'serverId and name are required' },
        { status: 400 }
      );
    }
    const headers = await getAdminHeaders();

    const data = {
      serverId: clientData.serverId,
      name: clientData.name,
      scopes: clientData.scopes || [],
    };
    const response = await fetch(`${AGENT_SERVER_URL}/servers/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to register client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register client' },
      { status: 500 }
    );
  }
}

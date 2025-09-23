import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '../../../../../../lib/admin-auth';

const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await context.params;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/clients/${clientId}/secret`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to get client secret: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to get client secret:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get client secret' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await context.params;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/api/clients/${clientId}/secret`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to reset client secret: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to reset client secret:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset client secret' },
      { status: 500 }
    );
  }
}

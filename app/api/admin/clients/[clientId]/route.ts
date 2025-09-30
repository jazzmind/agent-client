import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '../../../../../lib/admin-auth';

const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function DELETE(
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
    const response = await fetch(`${AGENT_SERVER_URL}/admin/clients/${clientId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to delete client: ${response.status} ${errorData}`);
    }

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await context.params;
    const { scopes } = await request.json();
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(scopes)) {
      return NextResponse.json(
        { error: 'Scopes must be an array' },
        { status: 400 }
      );
    }

    const headers = await getAdminHeaders();
    const response = await fetch(`${AGENT_SERVER_URL}/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scopes,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to update client scopes: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to update client scopes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update client scopes' },
      { status: 500 }
    );
  }
}

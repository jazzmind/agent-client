import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

// Get client secret
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

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/admin/clients/${clientId}/secret`, {
      method: 'GET',
      headers: authHeaders
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

// Reset client secret
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

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/admin/clients/${clientId}/secret`, {
      method: 'POST',
      headers: authHeaders
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
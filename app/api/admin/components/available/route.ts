import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const componentType = searchParams.get('type');
    
    const authHeaders = await getAdminHeaders();
    
    // Build query string for the backend request
    const queryString = componentType ? `?type=${encodeURIComponent(componentType)}` : '';
    
    const response = await fetch(`${AGENT_SERVER_URL}/components/available${queryString}`, {
      method: 'GET',
      headers: authHeaders
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch available components: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch available components:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available components' },
      { status: 500 }
    );
  }
}

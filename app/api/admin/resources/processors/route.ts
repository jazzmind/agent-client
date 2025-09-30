import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/api/resources/processors`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch processors: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch processors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch processors' },
      { status: 500 }
    );
  }
}

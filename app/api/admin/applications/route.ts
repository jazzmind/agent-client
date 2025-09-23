import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET() {
  try {
    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${AGENT_SERVER_URL}/applications`, {
      method: 'GET',
      headers: authHeaders
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch applications: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to list applications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const applicationData = await request.json();
    
    // Validate required fields
    if (!applicationData.name || !applicationData.display_name) {
      return NextResponse.json(
        { error: 'name and display_name are required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${AGENT_SERVER_URL}/applications`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create application: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create application' },
      { status: 500 }
    );
  }
}

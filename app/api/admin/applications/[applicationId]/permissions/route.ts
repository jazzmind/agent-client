import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await context.params;
    const permissionData = await request.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!permissionData.client_id || !Array.isArray(permissionData.component_scopes)) {
      return NextResponse.json(
        { error: 'client_id and component_scopes (array) are required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/applications/${applicationId}/permissions/${permissionData.client_id}`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permissionData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Application or client not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to grant permission: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to grant client permission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grant permission' },
      { status: 500 }
    );
  }
}

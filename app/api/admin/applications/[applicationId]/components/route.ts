import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const componentType = searchParams.get('type');
    
    const authHeaders = await getAdminHeaders();
    
    // Build query string for the backend request
    const queryString = componentType ? `?type=${encodeURIComponent(componentType)}` : '';
    
    const response = await fetch(`${baseUrl}/components${queryString}`, {
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await context.params;
    const componentData = await request.json();
    console.log('componentData', componentData);
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!componentData.component_type || !componentData.component_id || !componentData.component_name) {
      return NextResponse.json(
        { error: 'component_type, component_id, and component_name are required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/components/applications/${applicationId}`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      if (response.status === 409) {
        return NextResponse.json({ error: 'Component already exists in this application' }, { status: 409 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to add component: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add component to application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add component' },
      { status: 500 }
    );
  }
}

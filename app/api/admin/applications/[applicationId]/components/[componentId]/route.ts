import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string; componentId: string }> }
) {
  try {
    const { applicationId, componentId } = await context.params;
    const { searchParams } = new URL(request.url);
    const componentType = searchParams.get('type');
    
    if (!applicationId || !componentId) {
      return NextResponse.json(
        { error: 'Application ID and Component ID are required' },
        { status: 400 }
      );
    }

    if (!componentType) {
      return NextResponse.json(
        { error: 'Component type is required as query parameter' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/admin/components/applications/${applicationId}/${componentType}/${componentId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Application or component not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to remove component: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to remove component from application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove component' },
      { status: 500 }
    );
  }
}

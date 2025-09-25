import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string; clientId: string }> }
) {
  try {
    const { applicationId, clientId } = await context.params;
    
    if (!applicationId || !clientId) {
      return NextResponse.json(
        { error: 'Application ID and Client ID are required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/applications/${applicationId}/permissions/${clientId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to revoke permission: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to revoke client permission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke permission' },
      { status: 500 }
    );
  }
}

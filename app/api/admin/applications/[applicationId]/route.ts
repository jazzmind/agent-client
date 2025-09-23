import { NextRequest, NextResponse } from 'next/server';
import { getAdminHeaders } from '@/lib/admin-auth';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await context.params;
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: 'GET',
      headers: authHeaders
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to fetch application: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to get application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await context.params;
    const updateData = await request.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to update application: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to update application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await context.params;
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const authHeaders = await getAdminHeaders();
    
    const response = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      const errorData = await response.text();
      throw new Error(`Failed to delete application: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to delete application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete application' },
      { status: 500 }
    );
  }
}

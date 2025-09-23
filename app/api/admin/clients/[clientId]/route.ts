import { NextRequest, NextResponse } from 'next/server';
import { deleteClient, updateClientScopes } from '../../../../../lib/admin-client.ts.old';

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

    await deleteClient(clientId);
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

    const result = await updateClientScopes(clientId, scopes);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update client scopes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update client scopes' },
      { status: 500 }
    );
  }
}

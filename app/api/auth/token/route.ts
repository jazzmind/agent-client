import { NextRequest, NextResponse } from 'next/server';

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    const response = await fetch(`${baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });
    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Token request failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Token endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

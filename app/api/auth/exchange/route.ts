import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/exchange
 * 
 * Exchange an SSO token from ai-portal for a session.
 * This endpoint receives the JWT token from ai-portal and stores it
 * in an httpOnly cookie for subsequent API requests.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Store token in httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 6, // 6 hours (match SSO token expiry)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Token exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}

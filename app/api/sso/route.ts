/**
 * SSO Authentication Endpoint
 * 
 * Handles SSO login from ai-portal.
 * URL: /api/sso?token=JWT_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSSOTokenFull, createSessionFromSSO } from '@/lib/sso';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=missing_token', request.url)
      );
    }

    console.log('[SSO] Validating token...');

    // Validate token (both local JWT and portal backend)
    const validation = await validateSSOTokenFull(token);

    if (!validation.valid) {
      console.error('[SSO] Token validation failed:', validation.error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(validation.error || 'invalid_token')}`, request.url)
      );
    }

    console.log('[SSO] Token valid for user:', validation.email);
    console.log('[SSO] Portal roles:', validation.roles);
    console.log('[SSO] Entra ID roles:', validation.entraId?.roles);
    console.log('[SSO] Entra ID groups:', validation.entraId?.groups);

    // Create session data
    const sessionData = createSessionFromSSO(validation);

    // Store session in cookie (or your session store)
    const cookieStore = await cookies();
    cookieStore.set('agent-client-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    console.log('[SSO] Session created, redirecting to dashboard');

    // Redirect to dashboard or home
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('[SSO] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/login?error=sso_failed', request.url)
    );
  }
}

/**
 * POST endpoint for programmatic SSO (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Validate token
    const validation = await validateSSOTokenFull(token);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid token' },
        { status: 401 }
      );
    }

    // Create session data
    const sessionData = createSessionFromSSO(validation);

    // Store session in cookie
    const cookieStore = await cookies();
    cookieStore.set('agent-client-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        email: validation.email,
        roles: validation.roles,
        entraId: validation.entraId,
      },
    });
  } catch (error) {
    console.error('[SSO] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'SSO failed' },
      { status: 500 }
    );
  }
}


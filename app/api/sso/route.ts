/**
 * SSO Authentication Endpoint (Zero Trust)
 * 
 * Handles SSO login from ai-portal using authz-issued RS256 tokens.
 * URL: /api/sso?token=JWT_TOKEN
 * 
 * Token is validated via authz JWKS endpoint - no shared secrets needed.
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

    console.log('[SSO] Validating token via authz JWKS...');

    // Validate token via authz JWKS
    const validation = await validateSSOTokenFull(token);

    if (!validation.valid) {
      console.error('[SSO] Token validation failed:', validation.error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(validation.error || 'invalid_token')}`, request.url)
      );
    }

    console.log('[SSO] Token valid for user:', validation.userId);
    console.log('[SSO] Roles:', validation.roles);
    console.log('[SSO] Scopes:', validation.scopes);

    // Create session data
    const sessionData = createSessionFromSSO(validation);

    // Store session in cookie
    const cookieStore = await cookies();
    cookieStore.set('agent-manager-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Also store the token for API calls
    // This token can be exchanged for downstream tokens via authz
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes (match token expiry)
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
 * POST endpoint for programmatic SSO
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

    // Validate token via authz JWKS
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
    cookieStore.set('agent-manager-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Also store the token for API calls
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: validation.userId,
        roles: validation.roles,
        scopes: validation.scopes,
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


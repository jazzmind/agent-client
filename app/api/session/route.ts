import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserRolesFromToken, parseJWTPayload, getUserIdFromToken, isTokenExpired } from '@/lib/auth-helper';

/**
 * GET /api/session
 *
 * Lightweight session endpoint for UI chrome (navbar/user dropdown).
 * Derives user identity from the existing JWT (cookie or Authorization header).
 */
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ user: null, isAuthenticated: false });
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    console.warn('[SESSION] Token is expired');
    return NextResponse.json({ user: null, isAuthenticated: false });
  }

  const payload = parseJWTPayload(token);
  if (!payload) {
    console.warn('[SESSION] Failed to parse JWT payload');
    return NextResponse.json({ user: null, isAuthenticated: false });
  }

  const roles = getUserRolesFromToken(token);
  const userId = getUserIdFromToken(token) || payload.sub || payload.user_id || payload.userId || null;

  const email =
    payload.email ||
    payload.preferred_username ||
    payload.upn ||
    payload.unique_name ||
    payload.username ||
    null;

  return NextResponse.json({
    user: userId
      ? {
          id: String(userId),
          email: email ? String(email) : String(userId),
          status: 'ACTIVE',
          roles,
        }
      : null,
    isAuthenticated: Boolean(userId),
  });
}




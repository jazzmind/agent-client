import { NextResponse } from 'next/server';

/**
 * POST /api/logout
 *
 * Clears auth cookies used by agent-client.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });

  // Clear known cookie names
  res.cookies.set('auth_token', '', { path: '/', expires: new Date(0) });
  res.cookies.set('access_token', '', { path: '/', expires: new Date(0) });

  return res;
}




/**
 * Authentication Middleware for Agent Manager
 *
 * Zero Trust Architecture:
 * - Uses SSO token (session JWT) from ai-portal for token exchange
 * - NO client credentials required
 * - The session JWT cryptographically proves user identity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from './auth-helper';
import { getAgentApiToken, getAgentApiTokenForTestUser } from './authz-client';

export interface AuthenticatedRequest {
  ssoToken: string | null;
  agentApiToken: string;
  isTestUser?: boolean;
}

/**
 * Require authentication and exchange SSO token for agent-api token (Zero Trust)
 *
 * This middleware:
 * 1. Extracts the SSO token (session JWT) from the request
 * 2. If no token but TEST_SESSION_JWT is set, uses test credentials
 * 3. Exchanges the session JWT for an agent-api access token (Zero Trust - no client credentials)
 * 4. Returns tokens for use in the route handler
 *
 * @param request - Next.js request
 * @returns Authenticated request with tokens, or error response
 */
export async function requireAuthWithTokenExchange(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse> {
  try {
    const ssoToken = getTokenFromRequest(request);

    // If no SSO token, check for test session JWT (local dev only)
    if (!ssoToken) {
      const testSessionJwt = process.env.TEST_SESSION_JWT;

      if (testSessionJwt) {
        console.log('[AUTH] No SSO token found, using TEST_SESSION_JWT for local development');

        // Use the test session JWT for Zero Trust exchange
        const agentApiToken = await getAgentApiToken(testSessionJwt);

        return {
          ssoToken: testSessionJwt,
          agentApiToken,
          isTestUser: true,
        };
      }

      return NextResponse.json(
        {
          error: 'Authentication required',
          message:
            'Please log in through the AI Portal and try again. For local testing, set TEST_SESSION_JWT to a valid session JWT.',
        },
        { status: 401 }
      );
    }

    // Exchange SSO token (session JWT) for authz token using Zero Trust
    const agentApiToken = await getAgentApiToken(ssoToken);

    return {
      ssoToken,
      agentApiToken,
      isTestUser: false,
    };
  } catch (error: any) {
    console.error('[AUTH] Token exchange failed:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: 'Authentication failed',
        message:
          'Failed to authenticate with the agent service. Please return to the AI Portal and log in again.',
        details: errorMessage,
      },
      { status: 401 }
    );
  }
}

/**
 * Optional authentication - returns tokens if available, null if not
 *
 * Use this for endpoints that work with or without authentication.
 *
 * @param request - Next.js request
 * @returns Authenticated request with tokens, or null if not authenticated
 */
export async function optionalAuth(request: NextRequest): Promise<AuthenticatedRequest | null> {
  try {
    const ssoToken = getTokenFromRequest(request);

    // Try test session JWT if no SSO token
    if (!ssoToken) {
      const testSessionJwt = process.env.TEST_SESSION_JWT;

      if (testSessionJwt) {
        const agentApiToken = await getAgentApiToken(testSessionJwt);
        return {
          ssoToken: testSessionJwt,
          agentApiToken,
          isTestUser: true,
        };
      }

      return null;
    }

    // Exchange SSO token for authz token using Zero Trust
    const agentApiToken = await getAgentApiToken(ssoToken);

    return {
      ssoToken,
      agentApiToken,
      isTestUser: false,
    };
  } catch (error: any) {
    console.error('[AUTH] Optional auth failed:', error);
    return null;
  }
}

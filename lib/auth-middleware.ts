/**
 * Authentication Middleware for Agent Manager
 * 
 * Provides helpers for authenticating requests and exchanging tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from './auth-helper';
import { getAgentApiToken } from './authz-client';

export interface AuthenticatedRequest {
  ssoToken: string;
  agentApiToken: string;
}

/**
 * Require authentication and exchange SSO token for agent-api token
 * 
 * This middleware:
 * 1. Extracts the SSO token from the request
 * 2. Exchanges it for an authz token that agent-server accepts
 * 3. Returns both tokens for use in the route handler
 * 
 * @param request - Next.js request
 * @returns Authenticated request with tokens, or error response
 */
export async function requireAuthWithTokenExchange(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse> {
  try {
    const ssoToken = getTokenFromRequest(request);
    
    if (!ssoToken) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please log in through the AI Portal and try again.'
        },
        { status: 401 }
      );
    }

    // Exchange SSO token for authz token
    const agentApiToken = await getAgentApiToken(ssoToken);
    
    return {
      ssoToken,
      agentApiToken,
    };
  } catch (error: any) {
    console.error('[AUTH] Token exchange failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        message: 'Failed to authenticate with the agent service. Please return to the AI Portal and log in again.',
        details: errorMessage
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
export async function optionalAuth(
  request: NextRequest
): Promise<AuthenticatedRequest | null> {
  try {
    const ssoToken = getTokenFromRequest(request);
    
    if (!ssoToken) {
      return null;
    }

    // Exchange SSO token for authz token
    const agentApiToken = await getAgentApiToken(ssoToken);
    
    return {
      ssoToken,
      agentApiToken,
    };
  } catch (error: any) {
    console.error('[AUTH] Optional auth failed:', error);
    return null;
  }
}

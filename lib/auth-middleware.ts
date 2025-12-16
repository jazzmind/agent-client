/**
 * Authentication Middleware for Agent Manager
 * 
 * Provides helpers for authenticating requests and exchanging tokens.
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
 * Require authentication and exchange SSO token for agent-api token
 * 
 * This middleware:
 * 1. Extracts the SSO token from the request
 * 2. If no token but TEST_USER_ID is set, uses test user credentials
 * 3. Exchanges for an authz token that agent-server accepts
 * 4. Returns both tokens for use in the route handler
 * 
 * @param request - Next.js request
 * @returns Authenticated request with tokens, or error response
 */
export async function requireAuthWithTokenExchange(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse> {
  try {
    const ssoToken = getTokenFromRequest(request);
    
    // If no SSO token, check for test user credentials (local dev only)
    if (!ssoToken) {
      const testUserId = process.env.TEST_USER_ID;
      const testUserEmail = process.env.TEST_USER_EMAIL;
      
      if (testUserId && testUserEmail) {
        console.log('[AUTH] No SSO token found, using test user credentials for local development');
        
        // Get authz token directly for test user (bypasses SSO)
        const agentApiToken = await getAgentApiTokenForTestUser(testUserId);
        
        return {
          ssoToken: null,
          agentApiToken,
          isTestUser: true,
        };
      }
      
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please log in through the AI Portal and try again. For local testing, set TEST_USER_ID and TEST_USER_EMAIL environment variables.'
        },
        { status: 401 }
      );
    }

    // Exchange SSO token for authz token
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
    
    // Try test user if no SSO token
    if (!ssoToken) {
      const testUserId = process.env.TEST_USER_ID;
      const testUserEmail = process.env.TEST_USER_EMAIL;
      
      if (testUserId && testUserEmail) {
        const agentApiToken = await getAgentApiTokenForTestUser(testUserId);
        return {
          ssoToken: null,
          agentApiToken,
          isTestUser: true,
        };
      }
      
      return null;
    }

    // Exchange SSO token for authz token
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

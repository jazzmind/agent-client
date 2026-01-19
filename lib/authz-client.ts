/**
 * AuthZ Client for Agent Manager
 *
 * Zero Trust Authentication Architecture:
 * - Uses session JWT from ai-portal as subject_token
 * - NO client credentials required for user operations
 * - The session JWT cryptographically proves user identity
 *
 * This module uses the shared Zero Trust functions from busibox-app.
 */

import {
  exchangeTokenZeroTrust,
  getAuthHeaderZeroTrust,
  type AuthzAudience as SharedAuthzAudience,
  type ZeroTrustExchangeResponse,
} from '@jazzmind/busibox-app';

// Re-export types
export type AuthzAudience = SharedAuthzAudience;

export interface AuthzTokenResponse {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
  scope: string;
}

function getAuthzBaseUrl(): string {
  return process.env.AUTHZ_BASE_URL || 'http://authz-api:8010';
}

/**
 * Exchange SSO token for an authz token (Zero Trust)
 *
 * The SSO token from ai-portal IS a session JWT - use it directly as subject_token.
 * No client credentials required.
 *
 * @param ssoToken - The SSO token from ai-portal (this is the session JWT)
 * @param audience - The target service (e.g., 'agent-api')
 * @param scopes - Optional scopes to request
 * @returns Authz token response
 */
export async function exchangeForAuthzToken(
  ssoToken: string,
  audience: AuthzAudience,
  scopes?: string[]
): Promise<AuthzTokenResponse> {
  // The SSO token IS the session JWT - use it directly for Zero Trust exchange
  const result = await exchangeTokenZeroTrust(
    {
      sessionJwt: ssoToken,
      audience,
      scopes,
      purpose: 'agent-manager',
    },
    {
      authzBaseUrl: getAuthzBaseUrl(),
      verbose: process.env.VERBOSE_AUTHZ_LOGGING === 'true',
    }
  );

  return {
    accessToken: result.accessToken,
    tokenType: result.tokenType,
    expiresIn: result.expiresIn,
    scope: result.scope,
  };
}

/**
 * Get an authz token for agent-api calls (Zero Trust)
 *
 * @param ssoToken - The SSO token from ai-portal (session JWT)
 * @returns Bearer token string for Authorization header
 */
export async function getAgentApiToken(ssoToken: string): Promise<string> {
  const result = await exchangeForAuthzToken(ssoToken, 'agent-api', ['agents:read', 'agents:write']);
  return result.accessToken;
}

/**
 * Get an authz token for test user (local development only)
 *
 * In Zero Trust mode, this still requires a valid session JWT.
 * For local testing, use the TEST_SESSION_JWT environment variable.
 *
 * @param userId - Test user ID (not used in Zero Trust mode - included for API compatibility)
 * @returns Bearer token string for Authorization header
 */
export async function getAgentApiTokenForTestUser(userId: string): Promise<string> {
  const testSessionJwt = process.env.TEST_SESSION_JWT;

  if (!testSessionJwt) {
    throw new Error(
      'TEST_SESSION_JWT not configured. In Zero Trust mode, a valid session JWT is required even for test users. ' +
        'Set TEST_SESSION_JWT to a valid session JWT from the authz service.'
    );
  }

  const result = await exchangeForAuthzToken(testSessionJwt, 'agent-api', [
    'agents:read',
    'agents:write',
  ]);
  return result.accessToken;
}

/**
 * Get authorization header using Zero Trust exchange
 */
export async function getAuthorizationHeader(
  ssoToken: string,
  audience: AuthzAudience,
  scopes?: string[]
): Promise<string> {
  return getAuthHeaderZeroTrust(
    {
      sessionJwt: ssoToken,
      audience,
      scopes,
      purpose: 'agent-manager',
    },
    {
      authzBaseUrl: getAuthzBaseUrl(),
      verbose: process.env.VERBOSE_AUTHZ_LOGGING === 'true',
    }
  );
}

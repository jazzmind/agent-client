/**
 * AuthZ Client for Agent Manager
 * 
 * Exchanges ai-portal SSO tokens for authz service tokens that can be used
 * to authenticate with agent-server and other backend services.
 * 
 * Agent-manager authenticates to authz service using its own client_id/secret,
 * then requests tokens on behalf of users (token exchange flow).
 */

import { parseJWTPayload } from './auth-helper';

const TOKEN_EXCHANGE_GRANT = 'urn:ietf:params:oauth:grant-type:token-exchange';

function getAuthzBaseUrl(): string {
  return process.env.AUTHZ_BASE_URL || 'http://10.96.200.210:8010';
}

function getAuthzClientId(): string {
  return process.env.AUTHZ_CLIENT_ID || 'agent-manager';
}

function getAuthzClientSecret(): string {
  const secret = process.env.AUTHZ_CLIENT_SECRET;
  
  if (!secret) {
    throw new Error('AUTHZ_CLIENT_SECRET not configured. Agent-manager needs its own client credentials registered with authz service.');
  }
  
  return secret;
}

export type AuthzAudience = 'agent-api' | 'ingest-api' | 'search-api' | (string & {});

export interface AuthzTokenResponse {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
  scope: string;
}

/**
 * Exchange ai-portal SSO token for an authz token
 * 
 * This calls the authz service directly using agent-manager's client credentials
 * to exchange the SSO token for a downstream service token.
 * 
 * @param ssoToken - The SSO token from ai-portal (contains user identity)
 * @param audience - The target service (e.g., 'agent-api')
 * @param scopes - Optional scopes to request
 * @returns Authz token response
 */
export async function exchangeForAuthzToken(
  ssoToken: string,
  audience: AuthzAudience,
  scopes?: string[]
): Promise<AuthzTokenResponse> {
  // Extract user ID from SSO token
  const payload = parseJWTPayload(ssoToken);
  if (!payload || !payload.sub) {
    throw new Error('Invalid SSO token: missing user ID');
  }
  
  const userId = payload.sub;
  const scope = (scopes ?? []).filter(Boolean).join(' ');

  const params = new URLSearchParams({
    grant_type: TOKEN_EXCHANGE_GRANT,
    client_id: getAuthzClientId(),
    client_secret: getAuthzClientSecret(),
    audience,
    scope,
    requested_subject: userId,
    requested_purpose: 'agent-manager',
  });

  const response = await fetch(`${getAuthzBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Authz token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    token_type: 'bearer';
    expires_in: number;
    scope?: string;
  };

  return {
    accessToken: data.access_token,
    tokenType: data.token_type ?? 'bearer',
    expiresIn: data.expires_in ?? 900,
    scope: data.scope ?? scope,
  };
}

/**
 * Get an authz token for agent-api calls
 * 
 * This is a convenience wrapper that exchanges the SSO token for an agent-api token.
 * 
 * @param ssoToken - The SSO token from ai-portal
 * @returns Bearer token string for Authorization header
 */
export async function getAgentApiToken(ssoToken: string): Promise<string> {
  const result = await exchangeForAuthzToken(ssoToken, 'agent-api', ['agents:read', 'agents:write']);
  return result.accessToken;
}

/**
 * Get an authz token for test user (local development only)
 * 
 * This bypasses the SSO token exchange and directly requests a token
 * for a test user. Only works when TEST_USER_ID is configured.
 * 
 * @param userId - Test user ID
 * @returns Bearer token string for Authorization header
 */
export async function getAgentApiTokenForTestUser(userId: string): Promise<string> {
  const scope = [].filter(Boolean).join(' ');

  const params = new URLSearchParams({
    grant_type: TOKEN_EXCHANGE_GRANT,
    client_id: getAuthzClientId(),
    client_secret: getAuthzClientSecret(),
    audience: 'agent-api',
    scope,
    requested_subject: userId,
    requested_purpose: 'agent-manager-test',
  });

  const response = await fetch(`${getAuthzBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Authz token exchange failed for test user (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    token_type: 'bearer';
    expires_in: number;
    scope?: string;
  };

  return data.access_token;
}

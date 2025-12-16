/**
 * AuthZ Client for Agent Manager
 * 
 * Exchanges ai-portal SSO tokens for authz service tokens that can be used
 * to authenticate with agent-server and other backend services.
 * 
 * This is a simplified version that works client-side by calling the
 * ai-portal's authz token endpoint.
 */

const AI_PORTAL_URL = process.env.NEXT_PUBLIC_AI_PORTAL_URL || 'http://10.96.200.201:3000';

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
 * This calls the ai-portal's /api/authz/token endpoint which handles
 * the actual token exchange with the authz service.
 * 
 * @param ssoToken - The SSO token from ai-portal
 * @param audience - The target service (e.g., 'agent-api')
 * @param scopes - Optional scopes to request
 * @returns Authz token response
 */
export async function exchangeForAuthzToken(
  ssoToken: string,
  audience: AuthzAudience,
  scopes?: string[]
): Promise<AuthzTokenResponse> {
  const response = await fetch(`${AI_PORTAL_URL}/api/authz/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ssoToken}`,
    },
    body: JSON.stringify({
      audience,
      scopes: scopes || [],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Token exchange failed' }));
    throw new Error(error.error || `Token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Invalid token exchange response');
  }

  return {
    accessToken: data.data.accessToken,
    tokenType: data.data.tokenType || 'bearer',
    expiresIn: data.data.expiresIn || 900,
    scope: data.data.scope || '',
  };
}

/**
 * Get an authz token for agent-api calls
 * 
 * This is a convenience wrapper that exchanges the SSO token for an agent-api token.
 * The token is cached in memory for the duration of the request.
 * 
 * @param ssoToken - The SSO token from ai-portal
 * @returns Bearer token string for Authorization header
 */
export async function getAgentApiToken(ssoToken: string): Promise<string> {
  const result = await exchangeForAuthzToken(ssoToken, 'agent-api', ['agents:read', 'agents:write']);
  return result.accessToken;
}

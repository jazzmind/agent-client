/**
 * SSO Authentication Library
 * 
 * Validates JWT tokens from ai-portal and creates local sessions.
 * Supports Entra ID roles and groups passthrough.
 */

import * as jose from 'jose';

// Environment variables
const SSO_JWT_SECRET = process.env.SSO_JWT_SECRET || process.env.JWT_SECRET || '';
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';
const AI_PORTAL_URL = process.env.AI_PORTAL_URL || 'https://ai.jaycashman.com';
const APP_ID = 'agent-manager-client'; // This should match the oauthClientId in ai-portal

if (!SSO_JWT_SECRET) {
  console.warn('[SSO] Warning: SSO_JWT_SECRET not configured');
}

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(SSO_JWT_SECRET);

// ============================================================================
// Types
// ============================================================================

export type SSOTokenPayload = {
  jti: string;
  sub: string;  // userId
  aud: string;  // appId
  iss: string;  // 'jay-cashman-portal'
  iat: number;
  exp: number;
  email: string;
  roles: string[];  // Portal roles
  appName: string;
  entraId: {
    roles: string[];      // Entra ID application roles
    groups: string[];     // Entra ID group IDs
    tenantId: string | null;
    objectId: string | null;
  };
};

export type SSOValidationResult = {
  valid: boolean;
  userId?: string;
  email?: string;
  roles?: string[];
  entraId?: {
    roles: string[];
    groups: string[];
    tenantId: string | null;
    objectId: string | null;
  };
  error?: string;
};

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Validate SSO token from ai-portal
 * 
 * This performs local JWT validation. For production, you should also
 * call the ai-portal validation endpoint to ensure the token hasn't been revoked.
 */
export async function validateSSOToken(token: string): Promise<SSOValidationResult> {
  try {
    // Verify and decode token
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'jay-cashman-portal',
      audience: APP_ID,
    });

    const ssoPayload = payload as unknown as SSOTokenPayload;

    // Additional validation: check expiration
    const now = Math.floor(Date.now() / 1000);
    if (ssoPayload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return {
      valid: true,
      userId: ssoPayload.sub,
      email: ssoPayload.email,
      roles: ssoPayload.roles,
      entraId: ssoPayload.entraId,
    };
  } catch (error) {
    console.error('[SSO] Token validation error:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid token' 
    };
  }
}

/**
 * Validate token with ai-portal backend (server-to-server)
 * 
 * This ensures the token hasn't been revoked and is still valid in the portal.
 * Call this after local JWT validation for maximum security.
 */
export async function validateWithPortal(token: string): Promise<SSOValidationResult> {
  try {
    const response = await fetch(`${AI_PORTAL_URL}/api/sso/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        appId: APP_ID,
        clientSecret: OAUTH_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { valid: false, error: error.message || 'Validation failed' };
    }

    const result = await response.json();
    return {
      valid: result.valid,
      userId: result.userId,
      email: result.email,
      roles: result.roles,
      entraId: result.entraId,
      error: result.error,
    };
  } catch (error) {
    console.error('[SSO] Portal validation error:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Portal validation failed' 
    };
  }
}

/**
 * Full validation: Local JWT + Portal backend check
 */
export async function validateSSOTokenFull(token: string): Promise<SSOValidationResult> {
  // First, validate JWT locally (fast)
  const localResult = await validateSSOToken(token);
  if (!localResult.valid) {
    return localResult;
  }

  // Then, validate with portal (ensures not revoked)
  const portalResult = await validateWithPortal(token);
  return portalResult;
}

// ============================================================================
// Session Management Helpers
// ============================================================================

/**
 * Create session data from SSO token
 * 
 * Use this to populate your app's session after successful SSO validation.
 */
export function createSessionFromSSO(validation: SSOValidationResult) {
  if (!validation.valid || !validation.userId || !validation.email) {
    throw new Error('Invalid SSO validation result');
  }

  return {
    userId: validation.userId,
    email: validation.email,
    roles: validation.roles || [],
    entraId: validation.entraId || {
      roles: [],
      groups: [],
      tenantId: null,
      objectId: null,
    },
    authenticatedAt: new Date().toISOString(),
    authMethod: 'sso',
  };
}

/**
 * Check if user has specific Entra ID role
 */
export function hasEntraIdRole(session: { entraId?: { roles: string[] } }, roleName: string): boolean {
  return session.entraId?.roles?.includes(roleName) || false;
}

/**
 * Check if user is in specific Entra ID group
 */
export function inEntraIdGroup(session: { entraId?: { groups: string[] } }, groupId: string): boolean {
  return session.entraId?.groups?.includes(groupId) || false;
}

/**
 * Check if user has portal role
 */
export function hasPortalRole(session: { roles?: string[] }, roleName: string): boolean {
  return session.roles?.includes(roleName) || false;
}


/**
 * SSO Authentication Library (Zero Trust)
 * 
 * Validates RS256 JWT tokens issued by authz service via JWKS.
 * 
 * Token Flow:
 * 1. User clicks app in ai-portal
 * 2. ai-portal exchanges user's session JWT for app-scoped token via authz
 * 3. authz verifies user has app access via RBAC bindings
 * 4. authz issues RS256 token with app_id claim and user's roles
 * 5. ai-portal redirects to agent-manager with token
 * 6. agent-manager validates token via authz JWKS
 * 
 * Token validation is done via authz JWKS endpoint - no shared secrets needed.
 */

import * as jose from 'jose';

// Environment variables
const AUTHZ_URL = process.env.AUTHZ_BASE_URL || 'http://authz-api:8010';
const APP_NAME = process.env.APP_NAME || 'Agent Manager';

// Cache JWKS for performance
let jwksCache: jose.JWTVerifyGetKey | null = null;
let jwksCacheTime: number = 0;
const JWKS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Types
// ============================================================================

export interface AppTokenPayload {
  iss: string;     // Issuer: 'authz-api'
  sub: string;     // Subject: user ID (UUID)
  aud: string;     // Audience: app name
  iat: number;     // Issued at
  exp: number;     // Expiration
  jti: string;     // Token ID
  scope: string;   // Space-separated scopes
  roles: Array<{ id: string; name: string }>;  // User's roles (filtered to app-granting roles)
  app_id?: string; // App resource ID (UUID) - present for app-scoped tokens
}

export interface SSOValidationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  roles?: string[];
  appId?: string;
  scopes?: string[];
  error?: string;
}

export interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  appId: string;
  scopes: string[];
  authenticatedAt: string;
  authMethod: 'sso';
}

// ============================================================================
// JWKS Verification
// ============================================================================

/**
 * Get or create JWKS verifier from authz service
 */
async function getJwksVerifier(): Promise<jose.JWTVerifyGetKey> {
  const now = Date.now();
  
  // Return cached JWKS if still valid
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
    return jwksCache;
  }
  
  // Fetch fresh JWKS from authz
  const jwksUrl = new URL('/.well-known/jwks.json', AUTHZ_URL);
  console.log('[SSO] Fetching JWKS from:', jwksUrl.toString());
  
  jwksCache = jose.createRemoteJWKSet(jwksUrl);
  jwksCacheTime = now;
  
  return jwksCache;
}

/**
 * Invalidate JWKS cache (call this if key rotation is detected)
 */
export function invalidateJwksCache(): void {
  jwksCache = null;
  jwksCacheTime = 0;
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Validate app-scoped token from authz
 * 
 * Token is RS256 signed by authz. We verify using authz JWKS endpoint.
 * No shared secrets needed - asymmetric verification.
 */
export async function validateSSOToken(token: string): Promise<SSOValidationResult> {
  try {
    const jwks = await getJwksVerifier();
    
    // Verify and decode token
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: 'authz-api',
      audience: APP_NAME,
    });

    const appToken = payload as unknown as AppTokenPayload;

    // Token is valid - extract user info
    return {
      valid: true,
      userId: appToken.sub,
      email: '', // Email not included in access tokens - get from session if needed
      roles: appToken.roles?.map(r => r.name) || [],
      appId: appToken.app_id,
      scopes: appToken.scope?.split(' ').filter(Boolean) || [],
    };
  } catch (error) {
    console.error('[SSO] Token validation error:', error);
    
    let errorMessage = 'Invalid token';
    if (error instanceof jose.errors.JWTExpired) {
      errorMessage = 'Token expired';
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
      errorMessage = 'Token claims validation failed';
    } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      errorMessage = 'Token signature verification failed';
      // Invalidate cache in case of key rotation
      invalidateJwksCache();
    }
    
    return { 
      valid: false, 
      error: errorMessage,
    };
  }
}

/**
 * Full validation - just validates the token via JWKS
 * 
 * With authz-issued tokens, we don't need a separate "portal validation" step
 * since the token is cryptographically signed by authz and contains all claims.
 */
export async function validateSSOTokenFull(token: string): Promise<SSOValidationResult> {
  return validateSSOToken(token);
}

// ============================================================================
// Session Management Helpers
// ============================================================================

/**
 * Create session data from validated SSO token
 */
export function createSessionFromSSO(validation: SSOValidationResult): SessionData {
  if (!validation.valid || !validation.userId) {
    throw new Error('Invalid SSO validation result');
  }

  return {
    userId: validation.userId,
    email: validation.email || '',
    roles: validation.roles || [],
    appId: validation.appId || '',
    scopes: validation.scopes || [],
    authenticatedAt: new Date().toISOString(),
    authMethod: 'sso',
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(session: { roles?: string[] }, roleName: string): boolean {
  return session.roles?.includes(roleName) || false;
}

/**
 * Check if user has specific scope
 */
export function hasScope(session: { scopes?: string[] }, scope: string): boolean {
  return session.scopes?.includes(scope) || false;
}

/**
 * Check if user is admin
 */
export function isAdmin(session: { roles?: string[] }): boolean {
  return hasRole(session, 'Admin');
}

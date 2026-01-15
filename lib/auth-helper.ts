/**
 * Authentication Helper Utilities
 * 
 * Provides JWT token management for agent-client including:
 * - Token extraction from requests
 * - Token validation
 * - Header generation
 * - Token refresh handling
 * 
 * Integrates with Busibox JWT authentication system.
 */

import { NextRequest } from 'next/server';
import { AuthenticationError } from './error-handler';

// ==========================================================================
// TOKEN EXTRACTION
// ==========================================================================

/**
 * Extract JWT token from Next.js request
 * Checks Authorization header first, then cookies
 */
export function getTokenFromRequest(request: NextRequest): string | undefined {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie (httpOnly cookie set by auth system)
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  // Check alternative cookie names
  const accessTokenCookie = request.cookies.get('access_token');
  if (accessTokenCookie) {
    return accessTokenCookie.value;
  }
  
  return undefined;
}

/**
 * Get session data from agent-client-session cookie
 * This is set by the SSO flow
 */
export function getSessionFromRequest(request: NextRequest): { userId: string; email: string; roles: string[] } | null {
  const sessionCookie = request.cookies.get('agent-client-session');
  if (!sessionCookie) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionCookie.value);
    return {
      userId: session.userId || session.user_id,
      email: session.email,
      roles: session.roles || [],
    };
  } catch {
    return null;
  }
}

/**
 * Extract token from client-side (browser)
 * Note: httpOnly cookies are not accessible from JavaScript
 */
export function getTokenFromClient(): string | undefined {
  // Check localStorage (if token is stored there)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return token;
    }
  }
  
  return undefined;
}

/**
 * Require token or throw authentication error
 */
export function requireToken(request: NextRequest): string {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new AuthenticationError('Authentication token required');
  }
  return token;
}

// ==========================================================================
// HEADER GENERATION
// ==========================================================================

/**
 * Generate authorization headers for API requests
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Generate headers for agent-server API requests
 */
export function getAgentServerHeaders(token?: string): Record<string, string> {
  return getAuthHeaders(token);
}

/**
 * Generate headers for SSE requests
 */
export function getSSEHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ==========================================================================
// TOKEN VALIDATION
// ==========================================================================

/**
 * Check if token is present (basic validation)
 */
export function hasToken(request: NextRequest): boolean {
  return getTokenFromRequest(request) !== undefined;
}

/**
 * Parse JWT token payload (without verification)
 * WARNING: This does NOT verify the signature. Use only for reading claims.
 */
export function parseJWTPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse JWT payload:', error);
    return null;
  }
}

/**
 * Check if token is expired (based on exp claim)
 * WARNING: This does NOT verify the signature. Use only for client-side checks.
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWTPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = parseJWTPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  return new Date(payload.exp * 1000);
}

/**
 * Get user ID from token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = parseJWTPayload(token);
  if (!payload) {
    return null;
  }
  
  // Check common JWT claim names for user ID
  return payload.sub || payload.user_id || payload.userId || null;
}

/**
 * Get user roles from token
 */
export function getUserRolesFromToken(token: string): string[] {
  const payload = parseJWTPayload(token);
  if (!payload) {
    return [];
  }
  
  // Check common JWT claim names for roles
  const roles = payload.roles || payload.role || payload.permissions || [];
  return Array.isArray(roles) ? roles : [roles];
}

/**
 * Check if user has specific role
 */
export function hasRole(token: string, role: string): boolean {
  const roles = getUserRolesFromToken(token);
  return roles.includes(role);
}

/**
 * Check if user is admin
 */
export function isAdmin(token: string): boolean {
  return hasRole(token, 'admin') || hasRole(token, 'administrator');
}

// ==========================================================================
// TOKEN REFRESH
// ==========================================================================

/**
 * Check if token needs refresh (within 5 minutes of expiration)
 */
export function shouldRefreshToken(token: string, bufferMinutes: number = 5): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return false;
  }
  
  const bufferMs = bufferMinutes * 60 * 1000;
  return Date.now() >= (expiration.getTime() - bufferMs);
}

/**
 * Refresh token by calling the local auth refresh endpoint
 * 
 * This calls /api/auth/refresh which exchanges the SSO token for a fresh
 * authz token from the authz service.
 * 
 * @param currentToken - The current token (used for Authorization header)
 * @returns New token string, or null if refresh failed
 */
export async function refreshToken(currentToken: string): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for SSO token
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      
      // If re-authentication is required, return null to trigger redirect
      if (data.requiresReauth) {
        console.warn('[AUTH] Token refresh requires re-authentication');
      }
      
      return null;
    }
    
    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

// ==========================================================================
// SCOPE VALIDATION
// ==========================================================================

/**
 * Get scopes from token
 */
export function getScopesFromToken(token: string): string[] {
  const payload = parseJWTPayload(token);
  if (!payload) {
    return [];
  }
  
  // Check common JWT claim names for scopes
  const scopes = payload.scope || payload.scopes || payload.permissions || [];
  
  // Handle space-separated string (OAuth2 standard)
  if (typeof scopes === 'string') {
    return scopes.split(' ').filter(Boolean);
  }
  
  return Array.isArray(scopes) ? scopes : [];
}

/**
 * Check if token has specific scope
 */
export function hasScope(token: string, scope: string): boolean {
  const scopes = getScopesFromToken(token);
  return scopes.includes(scope);
}

/**
 * Check if token has all required scopes
 */
export function hasAllScopes(token: string, requiredScopes: string[]): boolean {
  const scopes = getScopesFromToken(token);
  return requiredScopes.every(scope => scopes.includes(scope));
}

/**
 * Check if token has any of the required scopes
 */
export function hasAnyScope(token: string, requiredScopes: string[]): boolean {
  const scopes = getScopesFromToken(token);
  return requiredScopes.some(scope => scopes.includes(scope));
}

// ==========================================================================
// REQUEST HELPERS
// ==========================================================================

/**
 * Create authenticated fetch options
 */
export function getAuthenticatedFetchOptions(
  token?: string,
  options?: RequestInit
): RequestInit {
  const headers = new Headers(options?.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  return {
    ...options,
    headers,
  };
}

/**
 * Fetch with automatic token injection
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = getTokenFromClient();
  const fetchOptions = getAuthenticatedFetchOptions(token, options);
  
  const response = await fetch(url, fetchOptions);
  
  // Handle token expiration
  if (response.status === 401 && token) {
    // Try to refresh token
    const newToken = await refreshToken(token);
    if (newToken) {
      // Retry with new token
      const retryOptions = getAuthenticatedFetchOptions(newToken, options);
      return fetch(url, retryOptions);
    }
  }
  
  return response;
}

// ==========================================================================
// MIDDLEWARE HELPERS
// ==========================================================================

/**
 * Require authentication middleware
 */
export function requireAuth(handler: (request: NextRequest, token: string) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const token = requireToken(request);
    return handler(request, token);
  };
}

/**
 * Require admin role middleware
 */
export function requireAdmin(handler: (request: NextRequest, token: string) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const token = requireToken(request);
    
    if (!isAdmin(token)) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(request, token);
  };
}

/**
 * Require specific scopes middleware
 */
export function requireScopes(
  requiredScopes: string[],
  handler: (request: NextRequest, token: string) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const token = requireToken(request);
    
    if (!hasAllScopes(token, requiredScopes)) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions',
          required_scopes: requiredScopes,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(request, token);
  };
}

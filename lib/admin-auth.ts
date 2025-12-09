
const AGENT_SERVER_URL = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';
const ADMIN_CLIENT_ID = process.env.ADMIN_CLIENT_ID;
const ADMIN_CLIENT_SECRET = process.env.ADMIN_CLIENT_SECRET;
import { MastraClient } from "@mastra/client-js";

// Token cache to avoid repeated requests (in-memory for this demo)
let tokenCache: { token: string; expires: number } | null = null;
let tokenClaimsCache: Record<string, any> | null = null;

export async function getAdminHeaders() {
  const token = await getAdminAccessToken();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}


async function getAdminAccessToken(): Promise<string> {
  if (!ADMIN_CLIENT_ID || !ADMIN_CLIENT_SECRET) {
    throw new Error('Admin client credentials not configured');
  }

  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expires > Date.now() + 60000) { // 1 minute buffer
    return tokenCache.token;
  }

  // Request new token using OAuth 2.0 client credentials flow
  const response = await fetch(`${AGENT_SERVER_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: ADMIN_CLIENT_ID,
      client_secret: ADMIN_CLIENT_SECRET,
      audience: `${AGENT_SERVER_URL}/admin`,
      scope: 'admin.read admin.write client.read client.write rag.read rag.write'
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || errorData.error || 'Failed to get admin token');
  }

  const tokenData = await response.json();
  console.log('response', tokenData);
  
  // Cache the token
  tokenCache = {
    token: tokenData.access_token,
    expires: Date.now() + (tokenData.expires_in * 1000) - 60000 // Cache until 1 minute before expiry
  };

  return tokenData.access_token;
}

let mastraClientCache: MastraClient | null = null;

export async function getAdminMastraClient(): Promise<MastraClient> {
  //if (!mastraClientCache) {
    const authHeaders = await getAdminHeaders();
    return new MastraClient({
      baseUrl: AGENT_SERVER_URL,
      headers: authHeaders
    });
  //}
  //return mastraClientCache;
}

function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function getAdminIdentity() {
  const token = await getAdminAccessToken();
  if (tokenClaimsCache) {
    return { ...tokenClaimsCache, token };
  }

  const claims = decodeJwt(token) || {};
  const clientId = claims.client_id || claims.sub || ADMIN_CLIENT_ID || 'admin-client';
  const scopes: string[] = typeof claims.scope === 'string'
    ? claims.scope.split(/\s+/).filter(Boolean)
    : Array.isArray(claims.scope)
      ? claims.scope
      : (process.env.ADMIN_CLIENT_SCOPES || 'admin.read admin.write client.read client.write rag.read rag.write')
          .split(/\s+/)
          .filter(Boolean);

  tokenClaimsCache = {
    clientId,
    scopes,
    expiresAt: claims.exp ? claims.exp * 1000 : undefined,
    issuer: claims.iss,
    subject: claims.sub,
  };

  return { ...tokenClaimsCache, token };
}
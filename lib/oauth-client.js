/**
 * OAuth 2.0 Client Credentials Flow for Mastra Agent Authentication
 * Supports multiple services with different audiences and scopes
 */

// In-memory token cache - keyed by clientId + audience for multiple services
const tokenCaches = new Map();

/**
 * Service definitions with default audiences and scopes
 */
export const SERVICES = {
  agent: {
    audience: process.env.AGENT_API_AUD || 'https://busibox.local/agent',
    defaultScopes: ['agent.execute', 'agent.read'],
  },
  search: {
    audience: process.env.SEARCH_API_AUD || 'https://busibox.local/search',
    defaultScopes: ['search.execute', 'documents.read'],
  },
  documents: {
    audience: process.env.DOCUMENTS_API_AUD || 'https://busibox.local/documents',
    defaultScopes: ['documents.read', 'documents.write'],
  },
  weather: {
    // Legacy support for weather service
    audience: process.env.TOKEN_SERVICE_AUD || 'https://tools.local/weather',
    defaultScopes: ['weather.read'],
  },
};

/**
 * Common scope combinations for easy access
 */
export const SCOPE_PRESETS = {
  // Full document access (read + search + write)
  documentFull: ['documents.read', 'documents.write', 'search.execute'],
  // Read-only document access
  documentRead: ['documents.read', 'search.execute'],
  // Agent execution with document access
  agentWithDocs: ['agent.execute', 'documents.read', 'search.execute'],
  // Full agent access
  agentFull: ['agent.execute', 'agent.read', 'documents.read', 'search.execute'],
};

/**
 * Generate cache key for token storage
 */
function getCacheKey(clientId, audience) {
  return `${clientId}:${audience}`;
}

/**
 * Get access token using OAuth 2.0 client credentials flow
 * @param {Object} options - Authentication options
 * @param {string} options.clientId - Client ID (defaults to env.ADMIN_CLIENT_ID)
 * @param {string} options.clientSecret - Client secret (defaults to env.ADMIN_CLIENT_SECRET)
 * @param {string} options.audience - Token audience (defaults to agent service)
 * @param {string|string[]} options.scope - Requested scopes (string or array)
 * @param {string} options.service - Service name from SERVICES (alternative to audience)
 */
export async function getAccessToken(options = {}) {
  const clientId = options.clientId || process.env.ADMIN_CLIENT_ID;
  const clientSecret = options.clientSecret || process.env.ADMIN_CLIENT_SECRET;
  const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'https://agent-sundai.vercel.app';
  
  // Determine audience from service name or explicit audience
  let audience = options.audience;
  let defaultScopes = ['agent.execute'];
  
  if (options.service && SERVICES[options.service]) {
    audience = SERVICES[options.service].audience;
    defaultScopes = SERVICES[options.service].defaultScopes;
  } else if (!audience) {
    // Default to agent service
    audience = SERVICES.agent.audience;
    defaultScopes = SERVICES.agent.defaultScopes;
  }
  
  // Handle scope as string or array
  let scope;
  if (Array.isArray(options.scope)) {
    scope = options.scope.join(' ');
  } else if (options.scope) {
    scope = options.scope;
  } else {
    scope = defaultScopes.join(' ');
  }
  
  if (!clientId || !clientSecret) {
    throw new Error('CLIENT_ID and CLIENT_SECRET are required (either via parameters or environment variables)');
  }

  // Check if we have a valid cached token for this client + audience combination
  const cacheKey = getCacheKey(clientId, audience);
  const tokenCache = tokenCaches.get(cacheKey);
  if (tokenCache && tokenCache.expires > Date.now()) {
    console.log(`Using cached access token for client: ${clientId}, audience: ${audience}`);
    return tokenCache.token;
  }

  console.log(`Requesting new access token from: ${tokenServiceUrl}`);
  console.log(`  Client: ${clientId}`);
  console.log(`  Audience: ${audience}`);
  console.log(`  Scopes: ${scope}`);

  try {
    const response = await fetch(`${tokenServiceUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: audience,
        scope: scope
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token request failed: ${response.status} ${error}`);
    }

    const tokenData = await response.json();
    
    // Cache the token (subtract 60 seconds for safety buffer)
    const expiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;
    tokenCaches.set(cacheKey, {
      token: tokenData.access_token,
      expires: expiresAt
    });

    console.log(`Successfully obtained access token for client: ${clientId}, audience: ${audience}`);
    return tokenData.access_token;

  } catch (error) {
    console.error('OAuth token request failed:', error);
    throw error;
  }
}

/**
 * Get access token for document search service
 * @param {Object} options - Authentication options (clientId, clientSecret optional)
 */
export async function getDocumentSearchToken(options = {}) {
  return getAccessToken({
    ...options,
    service: 'search',
    scope: options.scope || SCOPE_PRESETS.documentRead,
  });
}

/**
 * Get access token for agent service with document access
 * @param {Object} options - Authentication options (clientId, clientSecret optional)
 */
export async function getAgentWithDocsToken(options = {}) {
  return getAccessToken({
    ...options,
    service: 'agent',
    scope: options.scope || SCOPE_PRESETS.agentWithDocs,
  });
}

/**
 * Get access token for full agent access
 * @param {Object} options - Authentication options (clientId, clientSecret optional)
 */
export async function getAgentFullToken(options = {}) {
  return getAccessToken({
    ...options,
    service: 'agent',
    scope: options.scope || SCOPE_PRESETS.agentFull,
  });
}

/**
 * Clear the cached token (useful for testing or on auth errors)
 * @param {string} clientId - Specific client to clear (optional)
 * @param {string} audience - Specific audience to clear (optional)
 * If neither provided, clears all tokens
 */
export function clearTokenCache(clientId = null, audience = null) {
  if (clientId && audience) {
    const cacheKey = getCacheKey(clientId, audience);
    tokenCaches.delete(cacheKey);
    console.log(`Cleared token cache for client: ${clientId}, audience: ${audience}`);
  } else if (clientId) {
    // Clear all tokens for this client
    for (const key of tokenCaches.keys()) {
      if (key.startsWith(`${clientId}:`)) {
        tokenCaches.delete(key);
      }
    }
    console.log(`Cleared all token caches for client: ${clientId}`);
  } else {
    tokenCaches.clear();
    console.log('Cleared all token caches');
  }
}

/**
 * Get authenticated headers for Mastra API calls
 * @param {Object} options - Authentication options (same as getAccessToken)
 */
export async function getAuthHeaders(options = {}) {
  const token = await getAccessToken(options);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get authenticated headers for document search
 * @param {Object} options - Authentication options
 */
export async function getDocumentSearchHeaders(options = {}) {
  const token = await getDocumentSearchToken(options);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get authenticated headers for agent with document access
 * @param {Object} options - Authentication options
 */
export async function getAgentWithDocsHeaders(options = {}) {
  const token = await getAgentWithDocsToken(options);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

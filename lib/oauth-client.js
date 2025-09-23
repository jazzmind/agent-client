/**
 * OAuth 2.0 Client Credentials Flow for Mastra Agent Authentication
 * Now supports passing credentials for testing different applications
 */

// In-memory token cache - keyed by clientId for multiple clients
const tokenCaches = new Map();

/**
 * Get access token using OAuth 2.0 client credentials flow
 * @param {Object} options - Authentication options
 * @param {string} options.clientId - Client ID (defaults to env.ADMIN_CLIENT_ID)
 * @param {string} options.clientSecret - Client secret (defaults to env.ADMIN_CLIENT_SECRET)
 * @param {string} options.audience - Token audience (defaults to env.TOKEN_SERVICE_AUD)
 * @param {string} options.scope - Requested scopes (defaults to 'weather.read')
 */
export async function getAccessToken(options = {}) {
  const clientId = options.clientId || process.env.ADMIN_CLIENT_ID;
  const clientSecret = options.clientSecret || process.env.ADMIN_CLIENT_SECRET;
  const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'https://agent-sundai.vercel.app';
  const audience = options.audience || process.env.TOKEN_SERVICE_AUD || 'https://tools.local/weather';
  const scope = options.scope || 'weather.read';
  
  if (!clientId || !clientSecret) {
    throw new Error('CLIENT_ID and CLIENT_SECRET are required (either via parameters or environment variables)');
  }

  // Check if we have a valid cached token for this client
  const tokenCache = tokenCaches.get(clientId);
  if (tokenCache && tokenCache.expires > Date.now()) {
    console.log(`Using cached access token for client: ${clientId}`);
    return tokenCache.token;
  }

  console.log('Requesting new access token from:', tokenServiceUrl);

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
    tokenCaches.set(clientId, {
      token: tokenData.access_token,
      expires: expiresAt
    });

    console.log(`Successfully obtained access token for client: ${clientId}`);
    return tokenData.access_token;

  } catch (error) {
    console.error('OAuth token request failed:', error);
    throw error;
  }
}

/**
 * Clear the cached token (useful for testing or on auth errors)
 * @param {string} clientId - Specific client to clear (optional, clears all if not provided)
 */
export function clearTokenCache(clientId = null) {
  if (clientId) {
    tokenCaches.delete(clientId);
    console.log(`Cleared token cache for client: ${clientId}`);
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

/**
 * OAuth 2.0 Client Credentials Flow for Mastra Agent Authentication
 */

// In-memory token cache
let tokenCache = null;

/**
 * Get access token using OAuth 2.0 client credentials flow
 */
export async function getAccessToken() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'https://agent-sundai.vercel.app';
  const audience = process.env.TOKEN_SERVICE_AUD || 'https://tools.local/weather';
  
  if (!clientId || !clientSecret) {
    throw new Error('CLIENT_ID and CLIENT_SECRET environment variables are required');
  }

  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expires > Date.now()) {
    console.log('Using cached access token');
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
        scope: 'weather.read'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token request failed: ${response.status} ${error}`);
    }

    const tokenData = await response.json();
    
    // Cache the token (subtract 60 seconds for safety buffer)
    const expiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;
    tokenCache = {
      token: tokenData.access_token,
      expires: expiresAt
    };

    console.log('Successfully obtained access token');
    return tokenData.access_token;

  } catch (error) {
    console.error('OAuth token request failed:', error);
    throw error;
  }
}

/**
 * Clear the cached token (useful for testing or on auth errors)
 */
export function clearTokenCache() {
  tokenCache = null;
}

/**
 * Get authenticated headers for Mastra API calls
 */
export async function getAuthHeaders() {
  const token = await getAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

import { MastraClient } from "@mastra/client-js";
import { getAuthHeaders } from "./oauth-client.js";
 
// Server-side Mastra client
const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

// Create authenticated client factory
export async function createAuthenticatedMastraClient() {
  const authHeaders = await getAuthHeaders();
  return new MastraClient({
    baseUrl,
    headers: authHeaders
  });
}

// For backwards compatibility, create a default client
// Note: This will make an OAuth request on import, so use createAuthenticatedMastraClient() for better control
export const mastraClient = await createAuthenticatedMastraClient();
/**
 * Utility for handling basePath in links and navigation
 * 
 * Next.js automatically handles basePath for:
 * - <Link> components
 * - router.push()
 * - Image src
 * 
 * But NOT for:
 * - <a> tags with href
 * - window.location
 * - External redirects
 */

/**
 * Get the configured basePath
 */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Prepend basePath to a URL if it's relative
 * 
 * @example
 * withBasePath('/weather') // => '/agents/weather' (if NEXT_PUBLIC_BASE_PATH=/agents)
 * withBasePath('https://example.com') // => 'https://example.com' (unchanged)
 */
export function withBasePath(url: string): string {
  const basePath = getBasePath();
  
  // Don't modify absolute URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  
  // Don't modify if basePath is not set
  if (!basePath) {
    return url;
  }
  
  // Don't add basePath if it's already there
  if (url.startsWith(basePath)) {
    return url;
  }
  
  // Ensure single slash between basePath and url
  if (url.startsWith('/')) {
    return `${basePath}${url}`;
  }
  
  return `${basePath}/${url}`;
}


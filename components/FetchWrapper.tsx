'use client';

import { useEffect } from 'react';

/**
 * Client component that installs the fetch wrapper in the browser
 * Must be a client component to run in browser context
 */
export function FetchWrapper() {
  useEffect(() => {
    const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
    
    if (!BASE_PATH) {
      console.log('[FetchWrapper] No basePath configured');
      return;
    }
    
    console.log('[FetchWrapper] Installing fetch wrapper with basePath:', BASE_PATH);
    
    const originalFetch = window.fetch;

    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      // Handle different input types
      let url: string;
      
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input instanceof Request) {
        url = input.url;
      } else {
        url = String(input);
      }
      
      // Debug logging for API calls
      // if (url.includes('/api/')) {
      //   console.log('[fetch wrapper]', { original: url, basePath: BASE_PATH });
      // }
      
      // Only modify URLs that:
      // 1. Start with /api (relative API routes)
      // 2. Don't already include the base path
      if (url.startsWith('/api') && !url.startsWith(BASE_PATH)) {
        url = `${BASE_PATH}${url}`;
        // console.log('[fetch wrapper] rewritten to:', url);
        
        // Create new Request object or URL string with modified path
        if (input instanceof Request) {
          input = new Request(url, input);
        } else if (input instanceof URL) {
          input = new URL(url, input);
        } else {
          input = url;
        }
      }
      
      return originalFetch.call(this, input, init);
    };
    
    // console.log('[FetchWrapper] Fetch wrapper installed');
  }, []); // Run once on mount
  
  return null; // Render nothing
}


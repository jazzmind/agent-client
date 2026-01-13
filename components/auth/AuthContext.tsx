/**
 * Authentication Context
 * 
 * Provides authentication state management including:
 * - Token exchange status tracking
 * - Ready signal for data fetching
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AuthContextValue {
  /** Whether auth is ready (no pending token exchange) */
  isReady: boolean;
  /** Whether a token exchange is in progress */
  isExchanging: boolean;
  /** Trigger a data refresh (call this after token exchange) */
  refreshKey: number;
}

const AuthContext = createContext<AuthContextValue>({
  isReady: true,
  isExchanging: false,
  refreshKey: 0,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExchanging, setIsExchanging] = useState(false);
  const [isReady, setIsReady] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      // No token in URL - we're ready immediately
      setIsReady(true);
      return;
    }

    // Token present - need to exchange it
    setIsReady(false);
    setIsExchanging(true);

    exchangeToken(token)
      .then(() => {
        console.log('[AuthProvider] Token exchange successful');
        // Increment refresh key to trigger data refetch
        setRefreshKey(prev => prev + 1);
      })
      .catch((error) => {
        console.error('[AuthProvider] Token exchange failed:', error);
      })
      .finally(() => {
        setIsExchanging(false);
        setIsReady(true);
        
        // Remove token from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        router.replace(url.pathname + url.search);
      });
  }, [searchParams, router]);

  return (
    <AuthContext.Provider value={{ isReady, isExchanging, refreshKey }}>
      {children}
    </AuthContext.Provider>
  );
}

async function exchangeToken(token: string): Promise<void> {
  const response = await fetch('/api/auth/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Token exchange failed');
  }

  // Also store in localStorage as backup for client-side requests
  try {
    localStorage.setItem('auth_token', token);
  } catch (e) {
    // Ignore localStorage errors
  }
}

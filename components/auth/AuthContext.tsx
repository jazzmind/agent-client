/**
 * Authentication Context
 * 
 * Provides authentication state management including:
 * - Token exchange status tracking
 * - Ready signal for data fetching
 * - Proactive token refresh via auth state manager
 * - Automatic redirect to portal when re-authentication is required
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createAuthStateManager,
  setGlobalAuthManager,
  clearGlobalAuthManager,
  setAuthInitializing,
  type AuthStateManager,
  type AuthState,
} from '@jazzmind/busibox-app/lib/auth';

interface AuthContextValue {
  /** Whether auth is ready (no pending token exchange) */
  isReady: boolean;
  /** Whether a token exchange is in progress */
  isExchanging: boolean;
  /** Trigger a data refresh (call this after token exchange) */
  refreshKey: number;
  /** Current auth state from the auth manager */
  authState: AuthState | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Force a token refresh */
  refreshToken: () => Promise<boolean>;
  /** Redirect to portal for re-authentication */
  redirectToPortal: (reason?: string) => void;
  /** Perform a system-wide logout */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isReady: true,
  isExchanging: false,
  refreshKey: 0,
  authState: null,
  isAuthenticated: false,
  refreshToken: async () => false,
  redirectToPortal: () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExchanging, setIsExchanging] = useState(false);
  const [isReady, setIsReady] = useState(false); // Start as not ready
  const [refreshKey, setRefreshKey] = useState(0);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [tokenExchangeComplete, setTokenExchangeComplete] = useState(false);
  
  const authManagerRef = useRef<AuthStateManager | null>(null);
  const hasInitializedRef = useRef(false);
  const portalUrl = process.env.NEXT_PUBLIC_AI_PORTAL_URL || 'http://localhost:3000';

  // On initial mount, set auth as initializing until we determine if there's a token
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Set initializing on mount - will be cleared when we check for token
      setAuthInitializing(true);
    }
  }, []);

  // Handle token exchange from URL FIRST, before starting auth manager
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      // No token in URL - mark exchange as complete immediately
      setAuthInitializing(false);
      setTokenExchangeComplete(true);
      setIsReady(true);
      return;
    }

    // Token present - need to exchange it before starting auth monitoring
    // Set initializing flag so FetchWrapper doesn't redirect on 401s
    console.log('[AuthProvider] Token found in URL, starting exchange...');
    setAuthInitializing(true);
    setIsReady(false);
    setIsExchanging(true);

    exchangeToken(token)
      .then(() => {
        console.log('[AuthProvider] Token exchange successful');
        setRefreshKey(prev => prev + 1);
      })
      .catch((error) => {
        console.error('[AuthProvider] Token exchange failed:', error);
      })
      .finally(() => {
        // Clear initializing flag - now 401s can trigger redirects
        setAuthInitializing(false);
        setIsExchanging(false);
        setIsReady(true);
        setTokenExchangeComplete(true);
        
        // Remove token from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        router.replace(url.pathname + url.search);
      });
  }, [searchParams, router]);

  // Initialize auth state manager ONLY after token exchange is complete
  useEffect(() => {
    // Don't start until token exchange is complete
    if (!tokenExchangeComplete) {
      console.log('[AuthProvider] Waiting for token exchange to complete before starting auth manager');
      return;
    }

    console.log('[AuthProvider] Token exchange complete, starting auth manager');

    // Create the auth state manager
    const manager = createAuthStateManager({
      refreshEndpoint: '/api/auth/refresh',
      sessionEndpoint: '/api/session',
      portalUrl,
      appId: 'agent-manager',
      checkIntervalMs: 30_000, // Check every 30 seconds
      refreshBufferMs: 5 * 60 * 1000, // Refresh 5 minutes before expiry
      autoRedirect: true,
      getToken: () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('auth_token');
        }
        return null;
      },
      setToken: (token) => {
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('auth_token', token);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      },
    });

    // Set as global manager for FetchWrapper to use
    setGlobalAuthManager(manager);
    authManagerRef.current = manager;

    // Subscribe to auth state changes
    const unsubscribeState = manager.on<AuthState>('authStateChanged', (state) => {
      console.log('[AuthProvider] Auth state changed:', state);
      setAuthState(state);
      // Trigger refresh of data when auth state changes
      setRefreshKey(prev => prev + 1);
    });

    // Subscribe to token refresh events
    const unsubscribeRefresh = manager.on('tokenRefreshed', () => {
      console.log('[AuthProvider] Token refreshed successfully');
      setRefreshKey(prev => prev + 1);
    });

    // Subscribe to re-auth requirements (auto-redirect is handled by manager)
    const unsubscribeReauth = manager.on('requiresReauth', (data: unknown) => {
      const reason = (data as { reason?: string })?.reason;
      console.log('[AuthProvider] Re-authentication required:', reason);
    });

    // Start monitoring - but give a brief delay to let cookies settle
    const startDelay = setTimeout(() => {
      manager.start();
    }, 100);

    return () => {
      clearTimeout(startDelay);
      unsubscribeState();
      unsubscribeRefresh();
      unsubscribeReauth();
      manager.stop();
      clearGlobalAuthManager();
    };
  }, [portalUrl, tokenExchangeComplete]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (authManagerRef.current) {
      return authManagerRef.current.refreshNow();
    }
    return false;
  }, []);

  const redirectToPortal = useCallback((reason?: string) => {
    if (authManagerRef.current) {
      authManagerRef.current.redirectToPortal(reason);
    } else {
      // Fallback redirect
      window.location.href = portalUrl;
    }
  }, [portalUrl]);

  const logout = useCallback(async () => {
    if (authManagerRef.current) {
      await authManagerRef.current.logout();
    } else {
      // Fallback logout - just clear local storage and redirect
      try {
        localStorage.removeItem('auth_token');
      } catch {
        // ignore
      }
      try {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      } catch {
        // ignore
      }
      window.location.href = `${portalUrl}/login`;
    }
  }, [portalUrl]);

  const isAuthenticated = authState?.isAuthenticated ?? false;

  return (
    <AuthContext.Provider value={{ 
      isReady, 
      isExchanging, 
      refreshKey, 
      authState,
      isAuthenticated,
      refreshToken,
      redirectToPortal,
      logout,
    }}>
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

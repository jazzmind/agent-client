'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FetchWrapper, Footer, VersionBar } from '@jazzmind/busibox-app';
import type { SessionData } from '@jazzmind/busibox-app';
import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import { CustomHeader } from '@/components/CustomHeader';

function AppShellContent({ children, basePath }: { children: React.ReactNode; basePath: string }) {
  const { isReady, refreshKey, authState, redirectToPortal, logout } = useAuth();
  const [session, setSession] = useState<SessionData>({ user: null, isAuthenticated: false });
  // Use absolute URL to avoid basePath prepending - just go to /portal (home is default)
  const portalUrl = process.env.NEXT_PUBLIC_AI_PORTAL_URL 
    ? `${process.env.NEXT_PUBLIC_AI_PORTAL_URL}` 
    : '/portal';
  
  // App home link (for app name) - should go to /agents
  const appHomeLink = basePath || '/';

  // URLs to skip auth handling for
  const skipAuthUrls = useMemo(() => [
    '/api/auth/refresh',
    '/api/auth/exchange',
    '/api/session',
    '/api/logout',
  ], []);

  // Use system-wide logout from auth context
  const onLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Sync session from auth state when it changes
  useEffect(() => {
    if (authState?.isAuthenticated && authState.user) {
      setSession({
        user: {
          id: authState.user.id,
          email: authState.user.email,
          status: 'ACTIVE',
          roles: authState.user.roles,
        },
        isAuthenticated: true,
      });
    }
  }, [authState]);

  // Load session after auth is ready, and reload when refreshKey changes
  useEffect(() => {
    if (!isReady) return;
    
    let cancelled = false;
    async function loadSession() {
      try {
        const res = await fetch('/api/session', {
          credentials: 'include', // Important: include cookies
        });
        const data = await res.json();
        if (!cancelled) setSession(data);
      } catch {
        if (!cancelled) setSession({ user: null, isAuthenticated: false });
      }
    }
    loadSession();
    return () => {
      cancelled = true;
    };
  }, [isReady, refreshKey]);

  // Handle auth errors - redirect to portal
  const handleAuthError = useCallback(() => {
    console.log('[AppShell] Auth error, redirecting to portal');
    redirectToPortal('session_expired');
  }, [redirectToPortal]);

  return (
    <>
      <FetchWrapper 
        skipAuthUrls={skipAuthUrls}
        onAuthError={handleAuthError}
        autoRetry={true}
      />
      <CustomHeader
        session={session}
        onLogout={onLogout}
        portalUrl={portalUrl}
        accountLink={`${process.env.NEXT_PUBLIC_AI_PORTAL_URL || ''}/account`}
        appHomeLink={appHomeLink}
        adminNavigation={[
          { href: `${basePath}/admin`, label: 'Admin Dashboard' },
        ]}
      />
      {/* App navigation (kept separate from shared header) */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
            Agents
          </Link>
          <Link href="/tasks" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Tasks
          </Link>
          <Link href="/tools" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Tools
          </Link>
          <Link href="/workflows" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Workflows
          </Link>
          <Link href="/admin" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Admin
          </Link>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <Footer />
      <VersionBar />
    </>
  );
}

export function AppShell({ children, basePath }: { children: React.ReactNode; basePath: string }) {
  return (
    <AuthProvider>
      <AppShellContent basePath={basePath}>{children}</AppShellContent>
    </AuthProvider>
  );
}


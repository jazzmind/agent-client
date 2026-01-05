'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FetchWrapper, Footer, VersionBar } from '@jazzmind/busibox-app';
import type { SessionData } from '@jazzmind/busibox-app';
import { TokenExchange } from '@/components/auth/TokenExchange';
import { CustomHeader } from '@/components/CustomHeader';

export function AppShell({ children, basePath }: { children: React.ReactNode; basePath: string }) {
  const [session, setSession] = useState<SessionData>({ user: null, isAuthenticated: false });
  // Use absolute URL to avoid basePath prepending - just go to /portal (home is default)
  const portalUrl = process.env.NEXT_PUBLIC_AI_PORTAL_URL 
    ? `${process.env.NEXT_PUBLIC_AI_PORTAL_URL}` 
    : '/portal';
  
  // App home link (for app name) - should go to /agents
  const appHomeLink = basePath || '/';

  const onLogout = useCallback(async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <>
      <TokenExchange />
      <FetchWrapper />
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
      <main className="min-h-screen">{children}</main>
      <Footer />
      <VersionBar />
    </>
  );
}


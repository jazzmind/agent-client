'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FetchWrapper, Footer, Header, VersionBar } from '@jazzmind/busibox-app';
import type { SessionData } from '@jazzmind/busibox-app';
import { TokenExchange } from '@/components/auth/TokenExchange';

export function AppShell({ children, basePath }: { children: React.ReactNode; basePath: string }) {
  const [session, setSession] = useState<SessionData>({ user: null, isAuthenticated: false });
  const portalUrl = process.env.NEXT_PUBLIC_AI_PORTAL_URL ? `${process.env.NEXT_PUBLIC_AI_PORTAL_URL}/portal/home` : '/portal/home';

  const onLogout = useCallback(async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
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
        const res = await fetch('/api/session');
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
      <Header
        session={session}
        onLogout={onLogout}
        appsLink={portalUrl}
        accountLink={`${process.env.NEXT_PUBLIC_AI_PORTAL_URL || ''}/portal/account`}
        adminNavigation={[
          { href: `${basePath}/admin`, label: 'Admin Dashboard' },
          { href: `${basePath}/simulator`, label: 'Simulator' },
          { href: `${basePath}/chat`, label: 'Chat' },
        ]}
      />
      {/* App navigation (kept separate from shared header) */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-900 hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Admin
          </Link>
          <Link href="/simulator" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Simulator
          </Link>
          <Link href="/chat" className="text-sm font-medium text-gray-700 hover:text-blue-600">
            Chat
          </Link>
        </div>
      </nav>
      <main className="min-h-screen">{children}</main>
      <Footer />
      <VersionBar />
    </>
  );
}


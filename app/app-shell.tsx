'use client';

import React, { useCallback, useMemo } from 'react';
import { FetchWrapper, Footer, Header, VersionBar } from '@jazzmind/busibox-app';
import type { SessionData } from '@jazzmind/busibox-app';

export function AppShell({ children, basePath }: { children: React.ReactNode; basePath: string }) {
  const session: SessionData = useMemo(
    () => ({
      user: null,
      isAuthenticated: false,
    }),
    []
  );

  const onLogout = useCallback(async () => {
    // agent-client stores non-httpOnly tokens (if any) in localStorage
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <FetchWrapper />
      <Header session={session} onLogout={onLogout} appsLink={`${basePath}/`} accountLink={`${basePath}/`} />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <VersionBar />
    </>
  );
}


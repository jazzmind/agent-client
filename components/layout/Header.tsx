'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Moon, Sun } from 'lucide-react';
import { getAdminIdentity } from '@/lib/admin-auth';

interface HeaderProps {
  basePath?: string;
  mastraUrl?: string;
  portalUrl?: string;
}

type Identity = {
  clientId?: string;
  scopes?: string[];
  expiresAt?: number;
  issuer?: string;
  subject?: string;
};

export function Header({ basePath = '', mastraUrl, portalUrl = '/' }: HeaderProps) {
  const [identity, setIdentity] = useState<Identity>({});
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const scopes = identity.scopes || [];
  const displayName = identity.subject || identity.clientId || 'Admin Client';
  const initials = useMemo(() => (displayName ? displayName.charAt(0).toUpperCase() : 'A'), [displayName]);
  const scopeText = scopes.length > 0 ? scopes.join(', ') : 'admin client';

  const link = (path: string) => `${basePath}${path}`;

  useEffect(() => {
    const current = (typeof document !== 'undefined' && document.documentElement.dataset.theme) as 'light' | 'dark' | undefined;
    if (current) setTheme(current);
  }, []);

  useEffect(() => {
    const loadIdentity = async () => {
      setLoadingIdentity(true);
      try {
        const info = await getAdminIdentity();
        setIdentity({
          clientId: info.clientId,
          scopes: info.scopes,
          expiresAt: info.expiresAt,
          issuer: info.issuer,
          subject: info.subject,
        });
      } catch (error) {
        console.error('Failed to load admin identity', error);
      } finally {
        setLoadingIdentity(false);
      }
    };
    loadIdentity();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = next;
    }
  };

  return (
    <header className="sticky top-0 z-50 shadow-lg bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={portalUrl} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Back to portal">
            <LayoutGrid className="w-5 h-5 text-white" />
          </Link>
          <Link href={link('/admin')} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center font-semibold shadow-sm transition-transform group-hover:scale-105">
              AC
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Agent Client</div>
              <div className="text-[11px] text-white/70">Admin & Simulator</div>
            </div>
          </Link>
          {mastraUrl && (
            <span className="text-[11px] text-white/80 px-2 py-1 rounded-full bg-white/10 border border-white/10">
              Connected: {mastraUrl}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={link('/admin')}
            className="text-sm text-white hover:text-indigo-100 font-medium px-2 py-1 transition-colors"
          >
            Admin
          </Link>
          <Link
            href={link('/simulator')}
            className="text-sm text-white hover:text-indigo-100 font-medium px-2 py-1 transition-colors"
          >
            Simulator
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
            title="Toggle theme"
            type="button"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-white/20">
            <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold shadow">
              {initials}
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-white truncate max-w-[200px]">
                {loadingIdentity ? 'Loading...' : displayName}
              </div>
              <div className="text-[11px] text-white/70 truncate max-w-[220px]">{scopeText}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

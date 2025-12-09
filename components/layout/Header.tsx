'use client';

import Link from 'next/link';
import { useMemo } from 'react';

interface HeaderProps {
  clientId?: string;
  scopes?: string[];
  basePath?: string;
  mastraUrl?: string;
}

export function Header({ clientId, scopes = [], basePath = '', mastraUrl }: HeaderProps) {
  const initials = useMemo(() => (clientId ? clientId.charAt(0).toUpperCase() : 'A'), [clientId]);
  const scopeText = scopes.length > 0 ? scopes.join(', ') : 'admin client';

  const link = (path: string) => `${basePath}${path}`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={link('/admin')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-semibold">
              AC
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">Agent Client</div>
              <div className="text-[11px] text-gray-500">Admin & Simulator</div>
            </div>
          </Link>
          {mastraUrl && (
            <span className="text-[11px] text-gray-600 px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
              Connected: {mastraUrl}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={link('/admin')}
            className="text-sm text-gray-700 hover:text-indigo-600 font-medium px-2 py-1"
          >
            Admin
          </Link>
          <Link
            href={link('/simulator')}
            className="text-sm text-gray-700 hover:text-indigo-600 font-medium px-2 py-1"
          >
            Simulator
          </Link>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-medium text-gray-900">{clientId || 'Admin Client'}</div>
              <div className="text-[11px] text-gray-500 truncate max-w-[180px]">{scopeText}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

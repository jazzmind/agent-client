'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useCustomization } from '@jazzmind/busibox-app';
import { ThemeToggle } from '@jazzmind/busibox-app';
import { LayoutGrid } from 'lucide-react';
import type { SessionData } from '@jazzmind/busibox-app';

export type CustomHeaderProps = {
  session: SessionData;
  onLogout: () => Promise<void>;
  portalUrl: string;
  accountLink: string;
  adminNavigation?: Array<{ href: string; label: string }>;
  appHomeLink: string; // Link for app name (goes to /agents)
};

export function CustomHeader({ 
  session, 
  onLogout,
  portalUrl,
  accountLink,
  adminNavigation = [],
  appHomeLink,
}: CustomHeaderProps) {
  const { customization } = useCustomization();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = session;
  const isAdmin = user?.roles?.includes('Admin');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await onLogout();
      setDropdownOpen(false);
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user initials
  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  // Format roles for display
  const getRoleDisplay = () => {
    if (!user?.roles || user.roles.length === 0) return 'User';
    
    const roles = user.roles;
    
    // If Admin role exists, show it first
    if (roles.includes('Admin')) {
      if (roles.length === 1) return 'Admin';
      return `Admin (+${roles.length - 1})`;
    }
    
    // Otherwise show first role alphabetically
    const sortedRoles = [...roles].sort();
    if (sortedRoles.length === 1) return sortedRoles[0];
    return `${sortedRoles[0]} (+${sortedRoles.length - 1})`;
  };

  return (
    <header 
      className="shadow-lg sticky top-0 z-50"
      style={{ backgroundColor: customization.primaryColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3 group">
            {/* Logo links to portal */}
            <Link href={portalUrl} className="flex items-center">
              {customization.logoUrl ? (
                <img 
                  src={customization.logoUrl} 
                  alt={customization.companyName} 
                  className="h-10 w-auto transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
                  <div className="w-8 h-8 rounded-full relative" style={{ borderWidth: '4px', borderColor: customization.primaryColor }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-sm transform rotate-45" style={{ backgroundColor: customization.primaryColor }}></div>
                    </div>
                  </div>
                </div>
              )}
            </Link>
            {/* App name links to app home */}
            <Link href={appHomeLink} className="ml-3">
              <div>
                <h1 
                  className="text-xl font-bold tracking-wide"
                  style={{ color: customization.textColor }}
                >
                  {customization.siteName}
                </h1>
                <p 
                  className="text-[10px] tracking-wider -mt-1 opacity-80"
                  style={{ color: customization.textColor }}
                >
                  {customization.slogan}
                </p>
              </div>
            </Link>
          </div>

          {/* Right side - Apps Nav + Theme Toggle + User Menu */}
          <div className="flex items-center gap-4">
            {/* Apps Navigation - Back to Portal */}
            <Link
              href={portalUrl}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Back to Portal"
            >
              <LayoutGrid className="w-5 h-5 text-white" />
            </Link>
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: customization.secondaryColor, color: customization.textColor }}
                  >
                    {initials}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium text-white">{user.email}</div>
                    <div className="text-xs opacity-80 text-white">{getRoleDisplay()}</div>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{getRoleDisplay()}</div>
                    </div>
                    
                    <Link
                      href={accountLink}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Account Settings
                    </Link>

                    {isAdmin && adminNavigation.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        {adminNavigation.map((nav) => (
                          <Link
                            key={nav.href}
                            href={nav.href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {nav.label}
                          </Link>
                        ))}
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={portalUrl}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


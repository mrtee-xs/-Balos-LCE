'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from './DashboardContext';
import { useRealtime } from './RealtimeProvider';
import { signOut } from '../../lib/actions/auth';
import { getBrandConfig } from '../../lib/utils';
import { formatDubaiTime } from '../../lib/date';
import {
  Settings,
  Building,
  Users,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { user, isAdmin, name } = useDashboard();
  const { connectionStatus } = useRealtime();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dubaiTime, setDubaiTime] = useState<string>('');

  const brand = getBrandConfig();

  useEffect(() => {
    const updateTime = () => {
      setDubaiTime(formatDubaiTime(new Date(), { includeSeconds: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/') return 'Overview';
    if (pathname.startsWith('/inbox')) return 'Inbox';
    if (pathname.startsWith('/leads')) return 'Leads';
    if (pathname.startsWith('/viewings')) return 'Viewings';
    if (pathname.startsWith('/properties')) return 'Properties';
    if (pathname.startsWith('/settings/business')) return 'Agency settings';
    if (pathname.startsWith('/settings/team')) return 'Team management';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-surface/90 backdrop-blur-md border-b border-border px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Mobile brand / Desktop title */}
      <div className="flex items-center gap-3">
        {/* Mobile brand display */}
        <div className="flex md:hidden items-center gap-2">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="h-6 w-auto object-contain" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-creek text-white font-heading font-bold text-sm flex items-center justify-center">
              {brand.name.charAt(0)}
            </div>
          )}
          <span className="font-heading font-bold text-base text-ink tracking-tight">
            {brand.name}
          </span>
        </div>

        {/* Desktop title */}
        <div className="hidden md:flex items-center gap-3">
          <h1 className="text-xl font-bold font-heading text-ink">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right side: Live Indicator, Dubai Time & User Profile / Settings Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Real-time connection indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-seaglass border border-border text-[11px] font-medium"
          title={`Realtime sync: ${connectionStatus.toLowerCase()}`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500'
                : connectionStatus === 'CONNECTING'
                ? 'bg-saffron animate-pulse'
                : 'bg-coral'
            }`}
          />
          <span className="text-ink-muted hidden xs:inline">
            {connectionStatus === 'CONNECTED' ? 'Live' : connectionStatus === 'CONNECTING' ? 'Connecting' : 'Offline'}
          </span>
        </div>

        {dubaiTime && (
          <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-seaglass border border-border text-xs text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-creek mr-1.5"></span>
            Dubai {dubaiTime} GST
          </div>
        )}

        {/* User / Settings dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-border hover:bg-seaglass transition text-sm text-ink"
            aria-expanded={dropdownOpen}
          >
            <div className="w-7 h-7 rounded-full bg-creek-light text-creek font-medium text-xs flex items-center justify-center">
              {(name || user.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-ink leading-tight">
                {name || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-ink-muted leading-tight capitalize">
                {isAdmin ? 'Admin' : 'Agent'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-52 bg-surface rounded-xl border border-border shadow-lg py-1.5 z-50 text-sm">
                <div className="px-3.5 py-2 border-b border-border/60">
                  <p className="text-xs font-semibold text-ink truncate">
                    {name || user.email}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-seaglass text-ink-muted capitalize">
                    {isAdmin ? 'Agency admin' : 'Licensed agent'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings/business"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-3.5 py-2 text-xs text-ink hover:bg-seaglass transition"
                  >
                    <Building className="w-3.5 h-3.5 mr-2 text-ink-muted" />
                    Agency settings
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/settings/team"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-3.5 py-2 text-xs text-ink hover:bg-seaglass transition"
                    >
                      <Users className="w-3.5 h-3.5 mr-2 text-ink-muted" />
                      Team management
                    </Link>
                  )}
                </div>

                <div className="border-t border-border/60 pt-1">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center px-3.5 py-2 text-xs text-coral hover:bg-coral-light transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from './DashboardContext';
import { useRealtime } from './RealtimeProvider';
import { getBrandConfig } from '../../lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  Building2,
  Building,
  UserCheck,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useDashboard();
  const { queueCount } = useRealtime();
  const brand = getBrandConfig();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare, badge: queueCount },
    { label: 'Leads', href: '/leads', icon: Users },
    { label: 'Viewings', href: '/viewings', icon: Calendar },
    { label: 'Properties', href: '/properties', icon: Building2 },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border shrink-0 select-none">
      {/* Brand logo & name */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.name} className="h-7 w-auto object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-creek text-white font-heading font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
            {brand.name.charAt(0)}
          </div>
        )}
        <div className="truncate">
          <span className="font-heading font-bold text-sm text-ink tracking-tight truncate block">
            {brand.name}
          </span>
          <span className="text-[11px] text-ink-muted block leading-none mt-0.5">
            Operations engine
          </span>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-[11px] font-medium text-ink-faint px-3 mb-2">
          Operations
        </div>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const showBadge = Boolean(item.badge && item.badge > 0);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-creek-light text-creek'
                  : 'text-ink-muted hover:text-ink hover:bg-seaglass'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? 'text-creek' : 'text-ink-soft'}`} />
                <span>{item.label}</span>
              </div>
              {showBadge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-coral text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Agency administration */}
        <div className="pt-6">
          <div className="text-[11px] font-medium text-ink-faint px-3 mb-2">
            Settings
          </div>
          <Link
            href="/settings/business"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              pathname.startsWith('/settings/business')
                ? 'bg-creek-light text-creek'
                : 'text-ink-muted hover:text-ink hover:bg-seaglass'
            }`}
          >
            <Building
              className={`w-4 h-4 ${
                pathname.startsWith('/settings/business') ? 'text-creek' : 'text-ink-soft'
              }`}
            />
            <span>Agency settings</span>
          </Link>

          {isAdmin && (
            <Link
              href="/settings/team"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith('/settings/team')
                  ? 'bg-creek-light text-creek'
                  : 'text-ink-muted hover:text-ink hover:bg-seaglass'
              }`}
            >
              <UserCheck
                className={`w-4 h-4 ${
                  pathname.startsWith('/settings/team') ? 'text-creek' : 'text-ink-soft'
                }`}
              />
              <span>Team management</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Footer info */}
      <div className="p-3 border-t border-border/70 text-center">
        <p className="text-[11px] text-ink-muted">
          Dubai Real Estate Engine
        </p>
      </div>
    </aside>
  );
}

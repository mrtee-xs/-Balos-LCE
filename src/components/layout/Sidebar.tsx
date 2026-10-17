'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from './DashboardContext';
import { useRealtime } from './RealtimeProvider';
import { useLanguage } from './LanguageProvider';
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
  const { t } = useLanguage();
  const brand = getBrandConfig();

  const navItems = [
    { label: t.nav.overview, href: '/', icon: LayoutDashboard },
    { label: t.nav.inbox, href: '/inbox', icon: MessageSquare, badge: queueCount },
    { label: t.nav.leads, href: '/leads', icon: Users },
    { label: t.nav.viewings, href: '/viewings', icon: Calendar },
    { label: t.nav.properties, href: '/properties', icon: Building2 },
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
          <div className="w-8 h-8 rounded-xl bg-ink text-white font-heading font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
            {brand.name.charAt(0)}
          </div>
        )}
        <div className="truncate">
          <span className="font-heading font-bold text-sm text-ink tracking-tight truncate block">
            {brand.name}
          </span>
          <span className="text-[11px] text-ink-soft block leading-none mt-0.5">
            {t.nav.operationsEngine}
          </span>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint px-3 mb-2">
          {t.nav.operations}
        </div>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const showBadge = Boolean(item.badge && item.badge > 0);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                active
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-seaglass'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-ink-soft'}`} />
                <span>{item.label}</span>
              </div>
              {showBadge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    active ? 'bg-white text-ink' : 'bg-ink text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Agency administration */}
        <div className="pt-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint px-3 mb-2">
            {t.nav.administration}
          </div>
          <Link
            href="/settings/business"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              pathname.startsWith('/settings/business')
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-seaglass'
            }`}
          >
            <Building
              className={`w-4 h-4 ${
                pathname.startsWith('/settings/business') ? 'text-white' : 'text-ink-soft'
              }`}
            />
            <span>{t.nav.agencySettings}</span>
          </Link>

          {isAdmin && (
            <Link
              href="/settings/team"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition mt-1 ${
                pathname.startsWith('/settings/team')
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-seaglass'
              }`}
            >
              <UserCheck
                className={`w-4 h-4 ${
                  pathname.startsWith('/settings/team') ? 'text-white' : 'text-ink-soft'
                }`}
              />
              <span>{t.nav.teamManagement}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Footer info */}
      <div className="p-3.5 border-t border-border/70 flex items-center justify-between text-[11px] text-ink-soft">
        <span>{t.nav.footerTagline}</span>
        <span className="font-mono text-[10px] text-ink-faint">{t.nav.version}</span>
      </div>
    </aside>
  );
}

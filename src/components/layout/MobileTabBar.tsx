'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from './DashboardContext';
import { useRealtime } from './RealtimeProvider';
import { useLanguage } from './LanguageProvider';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  Building2,
  Menu,
} from 'lucide-react';

export function MobileTabBar() {
  const pathname = usePathname();
  const { mobileMenuOpen, setMobileMenuOpen } = useDashboard();
  const { queueCount } = useRealtime();
  const { t } = useLanguage();

  const tabs = [
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

  const isSettingsActive = pathname.startsWith('/settings') || mobileMenuOpen;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-t border-border px-1 grid grid-cols-6 items-center"
      aria-label="Mobile primary navigation"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href) && !mobileMenuOpen;
        const Icon = tab.icon;
        const showBadge = Boolean(tab.badge && tab.badge > 0);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-lg transition min-w-0 ${
              active ? 'text-creek' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 mb-0.5 ${
                  active ? 'text-creek stroke-[2.2]' : 'text-ink-soft'
                }`}
              />
              {showBadge && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-coral text-white min-w-[14px] text-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-medium leading-none truncate max-w-full ${
                active ? 'font-semibold text-creek' : ''
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}

      {/* 6th Tab: Opens full Sidebar Drawer (Settings, MCP, CRM, Team, Profile) */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen((v) => !v)}
        aria-expanded={mobileMenuOpen}
        aria-label="Open full menu and administration settings"
        className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-lg transition min-w-0 ${
          isSettingsActive ? 'text-creek' : 'text-ink-muted hover:text-ink'
        }`}
      >
        <Menu
          className={`w-5 h-5 mb-0.5 ${
            isSettingsActive ? 'text-creek stroke-[2.2]' : 'text-ink-soft'
          }`}
        />
        <span
          className={`text-[10px] font-medium leading-none truncate max-w-full ${
            isSettingsActive ? 'font-semibold text-creek' : ''
          }`}
        >
          Menu
        </span>
      </button>
    </nav>
  );
}

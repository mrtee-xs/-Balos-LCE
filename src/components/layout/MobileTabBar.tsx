'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRealtime } from './RealtimeProvider';
import { useLanguage } from './LanguageProvider';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  Building2,
} from 'lucide-react';

export function MobileTabBar() {
  const pathname = usePathname();
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface/95 backdrop-blur-md border-t border-border px-2 flex items-center justify-around">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;
        const showBadge = Boolean(tab.badge && tab.badge > 0);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition ${
              active
                ? 'text-creek'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-creek stroke-[2.2]' : 'text-ink-soft'}`} />
              {showBadge && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-coral text-white min-w-[14px] text-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[11px] font-medium leading-none ${active ? 'font-semibold text-creek' : ''}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

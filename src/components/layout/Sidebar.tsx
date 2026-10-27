'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from './DashboardContext';
import { useRealtime } from './RealtimeProvider';
import { useLanguage } from './LanguageProvider';
import { signOut } from '../../lib/actions/auth';
import { getBrandConfig } from '../../lib/utils';
import { formatAgentRole, isAgencyPrincipal } from '../../lib/types';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  Building2,
  Building,
  UserCheck,
  User,
  Bot,
  Share2,
  X,
  LogOut,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const {
    user,
    isAdmin,
    name,
    role,
    agentId,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useDashboard();
  const isPrincipal = isAgencyPrincipal(role, isAdmin);
  const roleLabel = formatAgentRole(role, isAdmin);
  const { queueCount } = useRealtime();
  const { t } = useLanguage();
  const brand = getBrandConfig();

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Close mobile drawer on Escape key and lock body scroll while open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen, setMobileMenuOpen]);

  const navItems = [
    { label: t.nav.overview, href: '/', icon: LayoutDashboard },
    { label: t.nav.inbox, href: '/inbox', icon: MessageSquare, badge: queueCount },
    { label: t.nav.leads, href: '/leads', icon: Users },
    { label: t.nav.viewings, href: '/viewings', icon: Calendar },
    { label: t.nav.properties, href: '/properties', icon: Building2 },
  ];

  const adminItems = [
    { label: t.nav.agencySettings, href: '/settings/business', icon: Building },
    { label: t.nav.teamManagement, href: '/settings/team', icon: UserCheck },
    { label: t.nav.mcpSettings, href: '/settings/mcp', icon: Bot },
    { label: t.nav.crmIntegrations, href: '/settings/crm', icon: Share2 },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderNavigationLinks = (onNavigate?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
            onClick={onNavigate}
            className={`flex items-center justify-between px-3 py-2.5 md:py-2 rounded-xl text-xs font-semibold transition ${
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

      {/* Agency administration for Principal / Admin */}
      {isPrincipal && (
        <div className="pt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint px-3 mb-2">
            {t.nav.administration}
          </div>
          {adminItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-xl text-xs font-semibold transition mt-1 first:mt-0 ${
                  active
                    ? 'bg-ink text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink hover:bg-seaglass'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-ink-soft'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Personal Profile & Credentials for any active agent or principal */}
      {agentId && (
        <div className="pt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint px-3 mb-2">
            My Account
          </div>
          <Link
            href="/settings/profile"
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-xl text-xs font-semibold transition ${
              pathname.startsWith('/settings/profile')
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-seaglass'
            }`}
          >
            <User
              className={`w-4 h-4 ${
                pathname.startsWith('/settings/profile') ? 'text-white' : 'text-ink-soft'
              }`}
            />
            <span>My Profile & Credentials</span>
          </Link>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop static left rail */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border shrink-0 select-none">
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

        {renderNavigationLinks()}

        <div className="p-3.5 border-t border-border/70 flex items-center justify-between text-[11px] text-ink-soft">
          <span>{t.nav.footerTagline}</span>
          <span className="font-mono text-[10px] text-ink-faint">{t.nav.version}</span>
        </div>
      </aside>

      {/* Mobile full slide-over navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Backdrop scrim */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-over drawer panel */}
          <aside className="relative z-10 w-72 max-w-[85vw] bg-surface border-r border-border flex flex-col h-full shadow-apple select-none">
            <div className="h-14 flex items-center justify-between gap-2 px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className="h-6 w-auto object-contain" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-ink text-white font-heading font-bold text-xs flex items-center justify-center shrink-0">
                    {brand.name.charAt(0)}
                  </div>
                )}
                <div className="truncate">
                  <span className="font-heading font-bold text-sm text-ink tracking-tight truncate block">
                    {brand.name}
                  </span>
                  <span className="text-[10px] text-ink-soft block leading-none mt-0.5">
                    {t.nav.operationsEngine}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl border border-border bg-surface hover:bg-seaglass text-ink-muted hover:text-ink transition shrink-0"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderNavigationLinks(() => setMobileMenuOpen(false))}

            {/* Mobile drawer user summary & sign out */}
            <div className="p-3 border-t border-border bg-surface-subtle space-y-2 shrink-0">
              <div className="flex items-center gap-2.5 px-1">
                <div className="w-8 h-8 rounded-full bg-ink text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {(name || user.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink truncate">
                    {name || user.email}
                  </p>
                  <p className="text-[10px] text-ink-muted truncate">
                    {roleLabel}
                  </p>
                </div>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-coral/30 bg-coral-light/50 hover:bg-coral-light text-xs font-semibold text-coral transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.header.signOut}</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

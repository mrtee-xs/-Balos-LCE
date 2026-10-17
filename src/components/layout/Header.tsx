'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from './DashboardContext';
import { useRealtime } from './RealtimeProvider';
import { useLanguage } from './LanguageProvider';
import { signOut } from '../../lib/actions/auth';
import { getBrandConfig } from '../../lib/utils';
import { formatDubaiTime } from '../../lib/date';
import { formatAgentRole, canAssignLeads } from '../../lib/types';
import {
  Building,
  Users,
  LogOut,
  ChevronDown,
  Bell,
  CheckCheck,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { user, isAdmin, name, role } = useDashboard();
  const { t } = useLanguage();
  const {
    connectionStatus,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    triggerDemoAssignmentNotification,
  } = useRealtime();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dubaiTime, setDubaiTime] = useState<string>('');

  const brand = getBrandConfig();
  const roleLabel = formatAgentRole(role, isAdmin);
  const isLeader = canAssignLeads(role, isAdmin);

  useEffect(() => {
    const updateTime = () => {
      setDubaiTime(formatDubaiTime(new Date(), { includeSeconds: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/') return t.nav.overview;
    if (pathname.startsWith('/inbox')) return t.nav.inbox;
    if (pathname.startsWith('/leads')) return t.nav.leads;
    if (pathname.startsWith('/viewings')) return t.nav.viewings;
    if (pathname.startsWith('/properties')) return t.nav.properties;
    if (pathname.startsWith('/settings/business')) return t.nav.agencySettings;
    if (pathname.startsWith('/settings/team')) return t.nav.teamManagement;
    return t.header.dashboard;
  };

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 apple-glass border-b border-border px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Mobile brand / Desktop title */}
      <div className="flex items-center gap-3">
        {/* Mobile brand display */}
        <div className="flex md:hidden items-center gap-2">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-6 w-auto object-contain"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-ink text-white font-heading font-bold text-sm flex items-center justify-center">
              {brand.name.charAt(0)}
            </div>
          )}
          <span className="font-heading font-bold text-base text-ink tracking-tight">
            {brand.name}
          </span>
        </div>

        {/* Desktop title */}
        <div className="hidden md:flex items-center gap-3">
          <h1 className="text-xl font-bold font-heading text-ink tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right side: Live Indicator, Dubai Time, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Real-time connection indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] font-medium shadow-xs"
          title={`Supabase Realtime: ${connectionStatus.toLowerCase()}`}
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
            {connectionStatus === 'CONNECTED'
              ? t.header.live
              : connectionStatus === 'CONNECTING'
              ? t.header.syncing
              : t.header.offline}
          </span>
        </div>

        {dubaiTime && (
          <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-surface border border-border text-xs text-ink-muted shadow-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-ink mr-1.5" />
            GST {dubaiTime}
          </div>
        )}

        {/* Notification Bell (Supabase Lead Assignment & Handoff Alerts) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setDropdownOpen(false);
            }}
            className="relative p-2 rounded-xl border border-border bg-surface hover:bg-seaglass text-ink transition shadow-xs"
            title={t.header.notifications}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-ink text-white text-[9px] font-bold flex items-center justify-center">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-2xl border border-border shadow-apple z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-surface-subtle flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-ink">
                      {t.header.notifications}
                    </p>
                    <p className="text-[10px] text-ink-muted">
                      {t.header.notificationsSynced}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerDemoAssignmentNotification}
                      className="px-2 py-1 rounded-lg bg-seaglass hover:bg-border/60 text-[10px] font-semibold text-ink inline-flex items-center gap-1 transition"
                      title="Simulate an instant lead assignment alert"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{t.header.testAlert}</span>
                    </button>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-ink-muted hover:text-ink inline-flex items-center gap-0.5 font-medium"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>{t.header.readAll}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-ink-muted space-y-1">
                      <UserCheck className="w-5 h-5 text-ink-soft mx-auto mb-1" />
                      <p className="font-medium text-ink">{t.header.noNewAlerts}</p>
                      <p className="text-[11px] text-ink-soft">
                        {t.header.noNewAlertsDesc}
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs transition ${
                          n.read ? 'bg-surface' : 'bg-seaglass/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-ink">{n.title}</p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-ink shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {n.body}
                        </p>
                        {n.leadId && (
                          <Link
                            href={`/inbox?lead=${n.leadId}`}
                            onClick={() => {
                              markAllNotificationsRead();
                              setNotifOpen(false);
                            }}
                            className="inline-block mt-1.5 text-[11px] font-semibold text-ink underline"
                          >
                            {t.header.viewLeadInInbox}
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User / Settings dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-border bg-surface hover:bg-seaglass transition text-sm text-ink shadow-xs"
            aria-expanded={dropdownOpen}
          >
            <div className="w-7 h-7 rounded-full bg-ink text-white font-medium text-xs flex items-center justify-center">
              {(name || user.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-ink leading-tight">
                {name || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-ink-muted leading-tight">
                {roleLabel}
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
              <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl border border-border shadow-apple py-1.5 z-50 text-sm">
                <div className="px-3.5 py-2.5 border-b border-border/60">
                  <p className="text-xs font-semibold text-ink truncate">
                    {name || user.email}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {user.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-seaglass text-ink border border-border">
                      {roleLabel}
                    </span>
                    {isLeader && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ink text-white">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {t.header.leader}
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings/business"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-3.5 py-2 text-xs text-ink hover:bg-seaglass transition"
                  >
                    <Building className="w-3.5 h-3.5 mr-2 text-ink-muted" />
                    {t.nav.agencySettings}
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/settings/team"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-3.5 py-2 text-xs text-ink hover:bg-seaglass transition"
                    >
                      <Users className="w-3.5 h-3.5 mr-2 text-ink-muted" />
                      {t.nav.teamManagement}
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
                      {t.header.signOut}
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

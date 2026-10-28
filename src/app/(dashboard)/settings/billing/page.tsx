'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/components/layout/DashboardContext';
import { SubscriptionTier } from '@/lib/types';
import {
  TIER_CONFIG,
  normalizeSubscriptionTier,
  getTierCapabilities,
} from '@/lib/entitlements';

export default function BillingSettingsPage() {
  const {
    agencyId,
    agencyName,
    subscriptionTier,
    subscriptionStatus,
    billingCycle = 'monthly',
    monthlyConversationLimit = 500,
    conversationsUsedThisMonth = 0,
    maxWhatsappLines = 1,
    email,
    name,
  } = useDashboard();

  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(
    billingCycle === 'yearly' ? 'yearly' : 'monthly'
  );
  const [upgradingTier, setUpgradingTier] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTier = normalizeSubscriptionTier(subscriptionTier);
  const currentCaps = getTierCapabilities(currentTier);

  const limit = monthlyConversationLimit || currentCaps.monthlyConversationLimit;
  const used = conversationsUsedThisMonth || 0;
  const usagePercent =
    limit >= 999999 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  const handleUpgrade = async (targetTier: SubscriptionTier) => {
    if (targetTier === currentTier) return;
    setError(null);
    setUpgradingTier(targetTier);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: targetTier,
          billingCycle: cycle,
          agencyId: agencyId || undefined,
          agencyName: agencyName || 'Agency Workspace',
          customerName: name || 'Agency Principal',
          customerEmail: email || 'admin@balos.tech',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        setError(data.error || 'Failed to initiate Payoneer checkout session');
        setUpgradingTier(null);
        return;
      }

      window.location.href = data.redirectUrl;
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err?.message || 'Unexpected checkout error');
      setUpgradingTier(null);
    }
  };

  const TIERS_LIST: SubscriptionTier[] = ['starter', 'growth', 'scale', 'enterprise'];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Billing & Subscription
            </h1>
            <span className="text-[10px] font-mono uppercase bg-seaglass-muted text-ink font-bold px-2 py-0.5 rounded border border-border">
              {currentCaps.name}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Manage your agency workspace subscription, Payoneer checkout, and usage quotas.
          </p>
        </div>

        {/* Billing cycle switch */}
        <div className="flex items-center p-1 bg-surface-muted rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              cycle === 'monthly'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setCycle('yearly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              cycle === 'yearly'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span>Yearly</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
              2 Mos Free
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Quota & Resource Usage Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversation Quota Meter */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-ink">Monthly Conversations</span>
            <span className="font-mono text-ink-muted">
              {limit >= 999999 ? 'Unlimited' : `${used} / ${limit}`}
            </span>
          </div>
          <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border-subtle">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent >= 90
                  ? 'bg-rose-500'
                  : usagePercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${limit >= 999999 ? 10 : usagePercent}%` }}
            />
          </div>
          <div className="text-[11px] text-ink-muted flex justify-between">
            <span>{limit >= 999999 ? 'Enterprise Pooled' : `${usagePercent}% used`}</span>
            <span>Resets on 1st of month</span>
          </div>
        </div>

        {/* WhatsApp Lines */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-2">
          <div className="text-xs font-semibold text-ink">Inbound WhatsApp Lines</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink font-mono">
              {maxWhatsappLines || currentCaps.maxWhatsappLines}
            </span>
            <span className="text-xs text-ink-muted">Dedicated Line(s)</span>
          </div>
          <p className="text-[11px] text-ink-muted">
            {maxWhatsappLines === 1
              ? 'Upgrade to Scale to connect 3 separate branch numbers.'
              : 'Multi-line routing active across branches.'}
          </p>
        </div>

        {/* Unlimited Agent Seats Mandate */}
        <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-950">Broker Team Logins</span>
            <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
              Included
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-950">
            Unlimited Seats
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Zero per-broker licensing charges. Add all sales agents and team leaders freely.
          </p>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS_LIST.map((t) => {
            const conf = TIER_CONFIG[t];
            const isCurrent = t === currentTier;
            const price = cycle === 'yearly' ? conf.yearlyPriceAED : conf.monthlyPriceAED;
            const isEnterprise = t === 'enterprise';

            return (
              <div
                key={t}
                className={`relative p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-surface border-ink shadow-md ring-1 ring-ink'
                    : 'bg-surface border-border hover:border-border-strong'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-ink text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                    Current Plan
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-ink">{conf.name}</h3>

                  <div className="mt-4 pb-4 border-b border-border">
                    {isEnterprise ? (
                      <div className="text-2xl font-extrabold text-ink">Bespoke</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-mono font-bold text-ink-muted">AED</span>
                        <span className="text-3xl font-extrabold text-ink">{price}</span>
                        <span className="text-xs text-ink-muted">/mo</span>
                      </div>
                    )}
                    <div className="text-[11px] text-ink-muted mt-1 font-mono">
                      {conf.monthlyConversationLimit >= 999999
                        ? 'Unlimited pooled volume'
                        : `${conf.monthlyConversationLimit.toLocaleString()} conv/mo`}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-medium text-amber-950">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Unlimited Broker Seats</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>
                        {conf.maxWhatsappLines} WhatsApp Line{conf.maxWhatsappLines > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-ink">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Core 24/7 AI Engine</span>
                    </div>

                    {conf.canHumanTakeover ? (
                      <div className="flex items-center gap-2 text-ink">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Human Takeover & Alerts</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-ink-faint">
                        <span>✕</span>
                        <span>Human Takeover</span>
                      </div>
                    )}

                    {conf.canAiCopilot ? (
                      <div className="flex items-center gap-2 text-ink">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>In-App AI Co-Pilot & Cards</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-ink-faint">
                        <span>✕</span>
                        <span>In-App AI Co-Pilot</span>
                      </div>
                    )}

                    {conf.canCrmSync ? (
                      <div className="flex items-center gap-2 text-ink">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>External CRM Sync Hub</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-ink-faint">
                        <span>✕</span>
                        <span>External CRM Sync</span>
                      </div>
                    )}

                    {conf.canRemoteMcp ? (
                      <div className="flex items-center gap-2 text-ink">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Remote MCP Server</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-ink-faint">
                        <span>✕</span>
                        <span>Remote MCP Server</span>
                      </div>
                    )}

                    {conf.canSalesforce && (
                      <div className="flex items-center gap-2 text-ink">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Salesforce & Custom ERP</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="mt-6 pt-4 border-t border-border">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-3 rounded-xl bg-surface-muted text-ink-muted text-xs font-semibold cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(t)}
                      disabled={Boolean(upgradingTier)}
                      className="w-full py-2.5 px-3 rounded-xl bg-ink hover:bg-ink-muted text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {upgradingTier === t ? (
                        <span>Connecting to Payoneer...</span>
                      ) : (
                        <span>Upgrade with Payoneer →</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payoneer Gateway Footer */}
      <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
            P
          </span>
          <span>Payoneer Checkout Gateway Integration</span>
        </div>
        <div>
          <span>Hosted 3D-Secure 2.0 AED Transactions · Cancel or switch anytime</span>
        </div>
      </div>
    </div>
  );
}

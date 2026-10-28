'use client';

import React from 'react';
import Link from 'next/link';
import { SubscriptionTier } from '@/lib/types';
import { TIER_CONFIG } from '@/lib/entitlements';

interface TierUpgradeGateProps {
  featureName: string;
  requiredTier: SubscriptionTier;
  description?: string;
  benefits?: string[];
  inline?: boolean;
}

export const TierUpgradeGate: React.FC<TierUpgradeGateProps> = ({
  featureName,
  requiredTier,
  description,
  benefits = [],
  inline = false,
}) => {
  const tierConfig = TIER_CONFIG[requiredTier] || TIER_CONFIG.growth;

  if (inline) {
    return (
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-ink">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
            🔒
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-amber-950">
                {featureName} Requires {tierConfig.name} Plan
              </h4>
              <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                {tierConfig.name}+
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              {description ||
                `Upgrade your agency subscription to unlock ${featureName} with immediate access.`}
            </p>
            <div className="mt-3">
              <Link
                href="/settings/billing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-white text-xs font-medium hover:bg-ink-muted transition-colors"
              >
                <span>Upgrade Plan with Payoneer</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 md:p-12 rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/60 to-white text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-sm my-6">
      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center text-xl mb-4">
        🔒
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-semibold uppercase mb-3">
        <span>Available on {tierConfig.name} Plan & Above</span>
      </div>

      <h3 className="text-2xl font-bold text-ink tracking-tight mb-2">
        Unlock {featureName}
      </h3>

      <p className="text-sm text-ink-muted max-w-lg mb-6 leading-relaxed">
        {description ||
          `This feature is reserved for ${tierConfig.name} and Enterprise tier agencies. Upgrade in under 60 seconds via Payoneer Checkout to activate it immediately.`}
      </p>

      {benefits.length > 0 && (
        <div className="w-full max-w-md bg-white p-4 rounded-xl border border-border text-left space-y-2 mb-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">
            Included in {tierConfig.name}:
          </div>
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-ink">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/settings/billing"
          className="px-6 py-2.5 rounded-pill bg-ink text-white hover:bg-ink-muted text-xs font-semibold shadow-sm transition-all"
        >
          View Plans & Upgrade with Payoneer →
        </Link>
      </div>

      <div className="mt-4 text-[11px] text-ink-faint flex items-center gap-1.5">
        <span className="text-emerald-600">✓</span>
        <span>Every plan includes unlimited broker seats & mobile logins</span>
      </div>
    </div>
  );
};

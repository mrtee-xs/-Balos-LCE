'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubscriptionTier } from '@/lib/types';
import { TIER_CONFIG, normalizeSubscriptionTier } from '@/lib/entitlements';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTier = searchParams.get('tier');
  const rawCycle = searchParams.get('cycle');
  const rawAgency = searchParams.get('agency') || '';
  const rawName = searchParams.get('name') || '';
  const rawEmail = searchParams.get('email') || '';
  const rawPhone = searchParams.get('phone') || '';
  const isCanceled = searchParams.get('canceled') === 'true';

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    normalizeSubscriptionTier(rawTier)
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    rawCycle === 'yearly' ? 'yearly' : 'monthly'
  );

  const [agencyName, setAgencyName] = useState(rawAgency);
  const [adminName, setAdminName] = useState(rawName);
  const [email, setEmail] = useState(rawEmail);
  const [phone, setPhone] = useState(rawPhone);
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentConfig = TIER_CONFIG[selectedTier];
  const price =
    billingCycle === 'yearly'
      ? currentConfig.yearlyPriceAED
      : currentConfig.monthlyPriceAED;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agencyName.trim() || !adminName.trim() || !email.trim() || !password) {
      setErrorMessage('Please complete all required fields including password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Register Auth User in Supabase
      let authUserId: string | null = null;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: adminName.trim(),
            agency_name: agencyName.trim(),
          },
        },
      });

      if (authError) {
        // If user already exists, let them proceed to checkout if it's an upgrade
        if (
          authError.message.includes('already registered') ||
          authError.message.includes('User already registered')
        ) {
          console.warn('User already exists in Auth, proceeding with checkout session');
        } else {
          setErrorMessage(authError.message);
          setIsLoading(false);
          return;
        }
      } else if (authData?.user?.id) {
        authUserId = authData.user.id;
      }

      // 2. Initiate Payoneer Checkout Session
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          billingCycle,
          agencyName: agencyName.trim(),
          customerName: adminName.trim(),
          customerEmail: email.trim().toLowerCase(),
          customerPhone: phone.trim() || undefined,
          authUserId,
        }),
      });

      const checkoutData = await res.json();

      if (!res.ok || !checkoutData.redirectUrl) {
        setErrorMessage(checkoutData.error || 'Failed to initiate payment session');
        setIsLoading(false);
        return;
      }

      // 3. Redirect to Hosted Checkout Page (or Sandbox Simulator)
      window.location.href = checkoutData.redirectUrl;
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMessage(err?.message || 'Unexpected registration error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
            B
          </div>
          <span className="font-semibold text-xl tracking-tight text-slate-950">
            balos
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
          Activate Your Agency Workspace
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Instant onboarding with full Dubai real estate intelligence and Payoneer billing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200 sm:rounded-3xl sm:px-10">
          {/* Canceled payment alert */}
          {isCanceled && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <span>Checkout was not completed. You can re-attempt below or select a different tier.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Tier Selector Chips */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Subscription Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['starter', 'growth', 'scale'] as SubscriptionTier[]).map((t) => {
                const conf = TIER_CONFIG[t];
                const active = selectedTier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className={`py-3 px-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{conf.name}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      AED {billingCycle === 'yearly' ? conf.yearlyPriceAED : conf.monthlyPriceAED}
                      /mo
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Billing Cycle Toggle */}
            <div className="mt-3 flex items-center justify-between p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`w-1/2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`w-1/2 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">
                  2 Mos Free
                </span>
              </button>
            </div>
          </div>

          {/* Plan Quotas & Unlimited Seats Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-950">Broker Logins & Mobile Access:</span>
              <span className="font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                Unlimited Seats (AED 0)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span>Included Conversations:</span>
              <span className="font-medium font-mono">
                {currentConfig.monthlyConversationLimit.toLocaleString()} / month
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span>WhatsApp Inbound Lines:</span>
              <span className="font-medium font-mono">
                {currentConfig.maxWhatsappLines} Dedicated Line{currentConfig.maxWhatsappLines > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agency Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prestige Prime Real Estate"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mansoor"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Phone
                </label>
                <input
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="tariq@prestigeprime.ae"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dashboard Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Initiating Payoneer Checkout...</span>
                ) : (
                  <span>
                    Proceed to Payoneer Checkout (AED {price}/mo) →
                  </span>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Already have an agency account?{' '}
              <Link href="/login" className="text-slate-950 font-semibold underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-xs text-slate-500">
          Loading signup...
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}

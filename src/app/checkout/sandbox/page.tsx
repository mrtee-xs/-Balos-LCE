'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

function SandboxSimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [loading, setLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<{
    tier?: string;
    agencyName?: string;
    amount?: number;
    billingCycle?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    // Look up session details if possible
    if (sessionId) {
      setSessionDetails({
        tier: 'Growth (Core)',
        agencyName: 'Agency Workspace',
        amount: 4999,
        billingCycle: 'monthly',
      });
    }
  }, [sessionId]);

  const handleApprove = () => {
    if (!sessionId) return;
    setLoading(true);
    // Redirect to the billing complete handler which provisions the agency
    window.location.href = `/api/billing/complete?sessionId=${encodeURIComponent(sessionId)}`;
  };

  const handleDecline = () => {
    router.push('/signup?canceled=true');
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center max-w-md">
          <h2 className="text-lg font-bold text-slate-900">Missing Checkout Session</h2>
          <p className="text-xs text-slate-500 mt-2">
            No valid Payoneer session ID was found in the checkout URL.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-slate-950 text-white rounded-full text-xs font-semibold"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Payoneer Sandbox Top Bar */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center">
              P
            </span>
            <span className="font-semibold text-sm tracking-tight">Payoneer Checkout</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
            Sandbox Simulator
          </span>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 text-[11px] text-amber-800 flex items-center gap-2">
          <span>ℹ</span>
          <span>Simulation mode active. Zero real charges will be made to any card.</span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Order Summary */}
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              Order Summary
            </div>
            <div className="mt-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Subscription Plan:</span>
                <span className="font-semibold text-slate-900">Balos AI Engine</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Agent Seats:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                  UNLIMITED BROKER SEATS (AED 0)
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Currency & Billing:</span>
                <span className="font-semibold text-slate-900">AED · Recurring</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-900">Total Due Today:</span>
                <span className="text-lg font-extrabold text-slate-950">AED Validated</span>
              </div>
            </div>
          </div>

          {/* Simulated Card Form */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700">Simulated Payment Card</div>
            <div className="space-y-2">
              <input
                type="text"
                readOnly
                value="4111 •••• •••• 1111 (Sandbox Test Card)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  readOnly
                  value="Expires: 12/28"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:outline-none"
                />
                <input
                  type="text"
                  readOnly
                  value="CVV: 888"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Auto-provisioning workspace...</span>
              ) : (
                <span>Simulate Successful Payment (Approve) →</span>
              )}
            </button>

            <button
              onClick={handleDecline}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 text-rose-600 border border-slate-200 font-semibold text-xs transition-all"
            >
              Simulate Card Declined / Cancel
            </button>
          </div>

          <div className="text-[11px] text-center text-slate-400 font-mono">
            Session: {sessionId}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayoneerSandboxSimulator() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-xs text-slate-500">
          Loading Payoneer Simulator...
        </div>
      }
    >
      <SandboxSimulatorContent />
    </Suspense>
  );
}

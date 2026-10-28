import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPayoneerCheckoutSession } from '@/lib/billing/payoneer';
import { normalizeSubscriptionTier, TIER_CONFIG } from '@/lib/entitlements';
import { saveCheckoutSession, updateCheckoutSession } from '@/lib/billing/sessions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tier: rawTier,
      billingCycle = 'monthly',
      agencyName,
      customerName,
      customerEmail,
      customerPhone,
      authUserId,
      agencyId, // Present if an existing agency is upgrading
    } = body;

    if (!customerEmail || !agencyName) {
      return NextResponse.json(
        { error: 'Agency name and customer email are required' },
        { status: 400 }
      );
    }

    const tier = normalizeSubscriptionTier(rawTier);
    const tierConfig = TIER_CONFIG[tier];
    const amount =
      billingCycle === 'yearly'
        ? tierConfig.yearlyPriceAED * 12
        : tierConfig.monthlyPriceAED;

    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. Create session record via resilient dual-layer storage
    await saveCheckoutSession({
      session_id: sessionId,
      agency_id: agencyId || null,
      tier,
      billing_cycle: billingCycle,
      amount,
      currency: 'AED',
      status: 'pending',
      customer_email: customerEmail.trim().toLowerCase(),
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      agency_name: agencyName.trim(),
      metadata: {
        auth_user_id: authUserId || null,
      },
    });

    // 2. Determine base URL
    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    // 3. Create Payoneer Checkout Session
    const payoneerResult = await createPayoneerCheckoutSession({
      sessionId,
      agencyName,
      customerName: customerName || 'Agency Principal',
      customerEmail,
      customerPhone,
      tier,
      billingCycle: billingCycle as 'monthly' | 'yearly',
      appBaseUrl: origin,
    });

    // 4. Update session with payoneer list ID if present
    if (payoneerResult.listId) {
      await updateCheckoutSession(sessionId, {
        payoneer_list_id: payoneerResult.listId,
      });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      redirectUrl: payoneerResult.redirectUrl,
      isSandboxFallback: payoneerResult.isSandboxFallback,
    });
  } catch (err: any) {
    console.error('[Billing Checkout] Exception during checkout initiation:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal checkout error' },
      { status: 500 }
    );
  }
}

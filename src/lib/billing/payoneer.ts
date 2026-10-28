import { SubscriptionTier } from '../types';
import { TIER_CONFIG } from '../entitlements';

export interface PayoneerCheckoutOptions {
  sessionId: string;
  agencyName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  tier: SubscriptionTier;
  billingCycle: 'monthly' | 'yearly';
  appBaseUrl: string;
}

export interface PayoneerSessionResult {
  redirectUrl: string;
  listId?: string;
  isSandboxFallback: boolean;
}

/**
 * Creates a Payoneer Hosted Checkout Session (`LIST` session)
 * Following official Payoneer Hosted Payment Page documentation.
 *
 * If `PAYONEER_API_TOKEN` is not configured, it gracefully defaults to
 * the built-in Sandbox Simulator route (`/checkout/sandbox`) so the complete
 * onboarding and auto-provisioning journey can be tested immediately.
 */
export async function createPayoneerCheckoutSession(
  options: PayoneerCheckoutOptions
): Promise<PayoneerSessionResult> {
  const {
    sessionId,
    agencyName,
    customerEmail,
    tier,
    billingCycle,
    appBaseUrl,
  } = options;

  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.starter;
  const amount =
    billingCycle === 'yearly'
      ? tierConfig.yearlyPriceAED * 12
      : tierConfig.monthlyPriceAED;

  const merchantCode = process.env.PAYONEER_MERCHANT_CODE;
  const apiToken = process.env.PAYONEER_API_TOKEN;
  const storeCode = process.env.PAYONEER_STORE_CODE || 'balos-store';
  const envMode = process.env.PAYONEER_ENV || 'sandbox';

  // If live or sandbox API credentials are not yet configured in .env,
  // route to the integrated Sandbox Checkout Simulator
  if (!merchantCode || !apiToken) {
    console.info(
      `[Payoneer] No PAYONEER_API_TOKEN configured. Falling back to built-in Sandbox Simulator for session ${sessionId}`
    );
    return {
      redirectUrl: `${appBaseUrl}/checkout/sandbox?sessionId=${encodeURIComponent(sessionId)}`,
      listId: `sim_${sessionId.slice(0, 12)}`,
      isSandboxFallback: true,
    };
  }

  const endpoint =
    envMode === 'live'
      ? 'https://api.live.oscato.com/api/lists'
      : 'https://api.sandbox.oscato.com/api/lists';

  const basicAuth = Buffer.from(`${merchantCode}:${apiToken}`).toString('base64');

  const returnUrl = `${appBaseUrl}/api/billing/complete?sessionId=${encodeURIComponent(sessionId)}`;
  const cancelUrl = `${appBaseUrl}/signup?canceled=true&tier=${tier}`;
  const notificationUrl = `${appBaseUrl}/api/billing/webhook/payoneer`;

  const payload = {
    integration: 'HOSTED',
    operationType: 'CHARGE',
    division: storeCode,
    transactionId: sessionId,
    country: 'AE',
    customer: {
      number: sessionId.slice(0, 16),
      email: customerEmail,
    },
    payment: {
      amount: amount,
      currency: 'AED',
      reference: `Balos ${tierConfig.name} (${billingCycle}) - ${agencyName}`,
    },
    callback: {
      returnUrl,
      cancelUrl,
      notificationUrl,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.optile.payment.enterprise-v1-extensible+json',
        Accept: 'application/vnd.optile.payment.enterprise-v1-extensible+json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Payoneer] API returned error ${response.status}:`, errorText);
      // Fallback to sandbox simulator if the remote endpoint refuses credentials
      return {
        redirectUrl: `${appBaseUrl}/checkout/sandbox?sessionId=${encodeURIComponent(sessionId)}`,
        listId: `sim_err_${sessionId.slice(0, 8)}`,
        isSandboxFallback: true,
      };
    }

    const data = await response.json();
    const redirectUrl = data?.links?.redirect;
    const listId = data?.identification?.longId || data?.identification?.shortId;

    if (!redirectUrl) {
      console.warn('[Payoneer] No redirect link returned in LIST response:', data);
      return {
        redirectUrl: `${appBaseUrl}/checkout/sandbox?sessionId=${encodeURIComponent(sessionId)}`,
        listId: listId || `sim_${sessionId.slice(0, 8)}`,
        isSandboxFallback: true,
      };
    }

    return {
      redirectUrl,
      listId,
      isSandboxFallback: false,
    };
  } catch (err) {
    console.error('[Payoneer] Network exception during LIST session creation:', err);
    return {
      redirectUrl: `${appBaseUrl}/checkout/sandbox?sessionId=${encodeURIComponent(sessionId)}`,
      listId: `sim_ex_${sessionId.slice(0, 8)}`,
      isSandboxFallback: true,
    };
  }
}

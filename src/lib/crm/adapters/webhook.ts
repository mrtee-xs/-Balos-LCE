import crypto from 'crypto';
import { CrmIntegration } from '../../types';
import { StandardCrmPayload } from '../payload';
import { AdapterResult } from './followupboss';

export async function sendToWebhook(
  integration: CrmIntegration,
  payload: StandardCrmPayload
): Promise<AdapterResult> {
  const url = integration.webhook_url?.trim() || integration.api_endpoint?.trim();

  if (!url) {
    return {
      success: false,
      httpStatus: 400,
      requestPayload: null,
      responsePayload: null,
      errorMessage: 'Webhook URL is missing.',
    };
  }

  const jsonString = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Balos-Lead-Engine/2.4 (Webhook-CRM)',
    'X-Balos-Event': payload.event,
    'X-Balos-Timestamp': payload.timestamp,
  };

  if (integration.webhook_secret?.trim()) {
    try {
      const hmac = crypto
        .createHmac('sha256', integration.webhook_secret.trim())
        .update(jsonString)
        .digest('hex');
      headers['X-Balos-Signature'] = `sha256=${hmac}`;
    } catch {
      // Ignore HMAC calculation errors
    }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: jsonString,
    });

    let resBody: any = null;
    try {
      resBody = await res.json();
    } catch {
      try {
        resBody = { text: await res.text() };
      } catch {
        resBody = { statusText: res.statusText };
      }
    }

    return {
      success: res.ok,
      httpStatus: res.status,
      requestPayload: payload,
      responsePayload: resBody,
      errorMessage: res.ok ? undefined : `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 0,
      requestPayload: payload,
      responsePayload: null,
      errorMessage: err.message || 'Network error triggering Webhook endpoint.',
    };
  }
}

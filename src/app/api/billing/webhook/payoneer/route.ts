import { NextRequest, NextResponse } from 'next/server';
import { provisionAgencyWorkspace } from '@/lib/billing/provisioning';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any = {};

    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.warn('[Payoneer Webhook] Received non-JSON body:', rawBody);
    }

    const sessionId =
      payload?.transactionId ||
      payload?.identification?.transactionId ||
      req.nextUrl.searchParams.get('transactionId');

    const statusCode =
      payload?.status?.code ||
      payload?.resultCode ||
      payload?.interaction?.code;

    console.info(
      `[Payoneer Webhook] Received notification for session ${sessionId}, code: ${statusCode}`
    );

    if (sessionId) {
      // Auto-provision if payment succeeded or interaction is PROCEED/CHARGED
      const isSuccess =
        !statusCode ||
        statusCode.includes('PROCEED') ||
        statusCode.includes('CHARGED') ||
        statusCode.startsWith('000.100');

      if (isSuccess) {
        await provisionAgencyWorkspace(sessionId);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('[Payoneer Webhook] Exception processing notification:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}

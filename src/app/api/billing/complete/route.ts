import { NextRequest, NextResponse } from 'next/server';
import { provisionAgencyWorkspace } from '@/lib/billing/provisioning';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/login?error=missing_session', req.url));
  }

  try {
    const result = await provisionAgencyWorkspace(sessionId);

    if (!result.success) {
      console.error('[Billing Complete] Provisioning failed for session:', sessionId, result.error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error || 'provisioning_failed')}`, req.url)
      );
    }

    // Redirect to dashboard with welcome flags
    const destination = new URL('/', req.url);
    destination.searchParams.set('billing', 'success');
    if (result.agencyName) {
      destination.searchParams.set('agency', result.agencyName);
    }

    return NextResponse.redirect(destination);
  } catch (err: any) {
    console.error('[Billing Complete] Unhandled exception:', err);
    return NextResponse.redirect(
      new URL('/login?error=checkout_completion_exception', req.url)
    );
  }
}

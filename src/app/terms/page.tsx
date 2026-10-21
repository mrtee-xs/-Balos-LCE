import Link from 'next/link';
import { getBrandConfig } from '../../lib/utils';
import { FileText, ArrowLeft, Building2, CheckCircle2, Shield, Phone } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Balos Real Estate Lead Conversion Engine',
  description: 'Terms of Service and WhatsApp communication conditions for Balos Real Estate, Dubai, UAE.',
};

export default function TermsPage() {
  const brand = getBrandConfig();

  return (
    <div className="min-h-screen bg-surface-subtle text-ink">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-7 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-ink text-white font-heading font-bold text-sm flex items-center justify-center">
                {brand.name.charAt(0)}
              </div>
            )}
            <span className="font-heading font-bold text-sm tracking-tight text-ink">
              {brand.name}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-ink-muted hover:text-ink px-3 py-1.5 rounded-lg border border-border bg-surface-pure hover:bg-seaglass transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Agent Login</span>
          </Link>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Title Banner */}
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-10 mb-8 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-creek-light text-creek text-xs font-semibold mb-4">
            <FileText className="w-3.5 h-3.5" />
            <span>Dubai Land Department (DLD) & RERA Regulatory Terms</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-ink tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            Last Updated: October 2026 • Governs usage of Balos WhatsApp lead conversion engine and advisory services.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-10 space-y-8 text-xs sm:text-sm text-ink-soft leading-relaxed shadow-xs">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Building2 className="w-4 h-4 text-creek" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing our web platforms or communicating with {brand.name} via WhatsApp, SMS, or email, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue use of our communication channels immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-creek" />
              2. Real Estate Advisory & Brokerage Services
            </h2>
            <p>
              {brand.name} operates as a licensed real estate consultancy in Dubai, United Arab Emirates, under the regulations of the Dubai Land Department (DLD) and the Real Estate Regulatory Agency (RERA). All property listings, brochures, pricing, projected rental yields (ROI), and developer payment plans provided via our automated WhatsApp engine or agents are indicative and subject to developer availability, price escalation, and formal contracts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Shield className="w-4 h-4 text-creek" />
              3. WhatsApp Communications & Consent
            </h2>
            <p>
              By initiating contact with us on WhatsApp or submitting an inquiry via Meta Click-to-WhatsApp ads, you provide express consent to receive real-time property details, viewing confirmations, and follow-up communications.
            </p>
            <p>
              You may revoke your messaging consent at any time by replying <strong>&quot;STOP&quot;</strong>, <strong>&quot;CANCEL&quot;</strong>, or <strong>&quot;UNSUBSCRIBE&quot;</strong> directly within your WhatsApp chat.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Phone className="w-4 h-4 text-creek" />
              4. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Emirate of Dubai and the Federal Laws of the United Arab Emirates. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the Courts of Dubai.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between text-xs text-ink-muted px-2">
          <span>&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-ink transition underline">Privacy Policy</Link>
            <Link href="/login" className="hover:text-ink transition">Portal Login</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

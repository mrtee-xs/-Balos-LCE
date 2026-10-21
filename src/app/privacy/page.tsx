import Link from 'next/link';
import { getBrandConfig } from '../../lib/utils';
import { Shield, ArrowLeft, Lock, CheckCircle2, MessageSquare, Building2, Mail, Phone } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Balos Real Estate Lead Conversion Engine',
  description: 'Privacy Policy and Personal Data Protection notice for Balos Real Estate WhatsApp AI operations, Dubai, UAE.',
};

export default function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            <span>UAE Personal Data Protection Law (PDPL) & Meta Platform Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-ink tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            Last Updated: October 2026 • Effective for all WhatsApp interactions, web inquiries, and client dossiers.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-10 space-y-8 text-xs sm:text-sm text-ink-soft leading-relaxed shadow-xs">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Building2 className="w-4 h-4 text-creek" />
              1. Introduction & Regulatory Framework
            </h2>
            <p>
              {brand.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Balos Lead Conversion Engine, an AI-powered conversational platform integrated with the official WhatsApp Business Platform. We are committed to safeguarding the privacy and personal data of our prospective buyers, tenants, investors, and clients.
            </p>
            <p>
              This Privacy Policy describes our practices in accordance with <strong>UAE Federal Decree-Law No. 45 of 2021 regarding Personal Data Protection (PDPL)</strong>, regulations issued by the <strong>Dubai Land Department (DLD)</strong> and the <strong>Real Estate Regulatory Agency (RERA)</strong>, as well as Meta Platform Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Lock className="w-4 h-4 text-creek" />
              2. Information We Collect
            </h2>
            <p>When you contact us via WhatsApp, Click-to-WhatsApp advertisements, Property Finder, Bayut, Dubizzle, or our web portals, we may collect and process:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Contact Information:</strong> Full name, phone number, WhatsApp ID (E.164 format), and email address.</li>
              <li><strong>Real Estate Preferences:</strong> Target budget in UAE Dirhams (AED), preferred communities (e.g. Downtown Dubai, Palm Jumeirah, Dubai Marina, Dubai Hills), property category (Villa, Apartment, Penthouse), and bedroom requirements.</li>
              <li><strong>Investment Profile:</strong> Market preferences (Off-Plan vs. Secondary/Ready), residency status (UAE Resident vs. International Investor), and UAE Golden Visa qualification indicators.</li>
              <li><strong>Viewing & Scheduling Details:</strong> Preferred dates, times, and viewing formats (Physical site visit, Virtual Zoom walkthrough, or Office consultation).</li>
              <li><strong>Chat History & Inquiries:</strong> Transcripts of your conversational exchanges with our automated WhatsApp engine and licensed real estate agents.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-creek" />
              3. AI Conversational Engine Disclosures
            </h2>
            <p>
              To provide immediate service 24/7/365, initial communications on our WhatsApp channel are facilitated by the Balos AI Engine. This engine automatically:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Answers inquiries regarding property availability, pricing, developer payment plans, and brochures.</li>
              <li>Calculates projected rental yields (ROI) and Golden Visa eligibility thresholds.</li>
              <li>Facilitates instant viewing bookings with verified calendar links.</li>
            </ul>
            <p>
              <strong>Human Supervision:</strong> All conversations are subject to oversight by licensed real estate brokers registered with RERA. You may request to speak with a human broker at any time during your chat by stating &quot;agent&quot; or &quot;speak to human&quot;.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-creek" />
              4. How We Use Your Information
            </h2>
            <p>Your data is strictly utilized for legitimate real estate advisory purposes, including:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Delivering property brochures, video walkthroughs, and official developer payment schedules.</li>
              <li>Arranging and confirming physical site visits and virtual property viewings.</li>
              <li>Assisting with Dubai Land Department registrations and RERA-compliant advisory.</li>
              <li>Synchronizing client dossiers into authorized brokerage CRM systems (such as Follow Up Boss, HubSpot, or Zoho) to maintain seamless customer service.</li>
            </ul>
            <p className="font-semibold text-ink">
              We never sell, rent, or trade your personal data or phone number to unauthorized third-party marketing entities.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Shield className="w-4 h-4 text-creek" />
              5. Data Security, Storage & Encryption
            </h2>
            <p>
              We enforce enterprise-grade security protocols to protect your personal information:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>All database storage is protected with PostgreSQL Row-Level Security (RLS) and encrypted at rest using AES-256.</li>
              <li>All web and API data transmissions are protected via Transport Layer Security (TLS 1.3 / HTTPS).</li>
              <li>Strict tenant isolation ensures that lead qualification dossiers are restricted solely to authorized licensed agents of {brand.name}.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Mail className="w-4 h-4 text-creek" />
              6. Your Rights & Instant WhatsApp Opt-Out
            </h2>
            <p>
              Under UAE PDPL and international privacy standards, you hold full rights to access, rectify, or request the deletion of your personal records.
            </p>
            <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/70 text-emerald-950 font-medium">
              <span className="font-bold block mb-1">Instant Opt-Out (Stop Messages):</span>
              You may immediately stop receiving WhatsApp messages at any time simply by replying <strong>&quot;STOP&quot;</strong>, <strong>&quot;UNSUBSCRIBE&quot;</strong>, or <strong>&quot;CANCEL&quot;</strong> in your WhatsApp thread. Your contact number will be automatically marked as opted out.
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink flex items-center gap-2">
              <Phone className="w-4 h-4 text-creek" />
              7. Contact & Data Protection Officer
            </h2>
            <p>For any inquiries regarding this policy, data deletion requests, or regulatory questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-border bg-surface-subtle">
                <span className="font-bold text-ink block">Email Support</span>
                <span className="font-mono text-xs text-ink-muted">vip@balosrealestate.ae</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-surface-subtle">
                <span className="font-bold text-ink block">Direct Telephone</span>
                <span className="font-mono text-xs text-ink-muted">+971 50 123 4567</span>
              </div>
            </div>
            <p className="text-[11px] text-ink-faint pt-2">
              Balos Real Estate Luxury Advisory • Downtown Dubai & Business Bay, Dubai, United Arab Emirates.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between text-xs text-ink-muted px-2">
          <span>&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-ink transition underline">Terms of Service</Link>
            <Link href="/login" className="hover:text-ink transition">Portal Login</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

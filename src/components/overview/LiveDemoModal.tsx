'use client';

import { useState, useEffect } from 'react';
import { getWhatsAppBotNumber } from '../../lib/utils';
import {
  Smartphone,
  QrCode,
  ExternalLink,
  X,
  Sparkles,
  Globe,
  Check,
  Copy,
} from 'lucide-react';

interface LiveDemoModalProps {
  defaultPhone?: string | null;
  propertyContext?: {
    title: string;
    community: string;
    priceFormatted: string;
    permitNo?: string | null;
  };
  buttonVariant?: 'primary' | 'outline' | 'card';
  buttonLabel?: string;
}

const PRESET_PROMPTS = [
  {
    id: 'pf-en',
    badge: 'Property Finder • EN',
    label: 'Ready 2BR in Downtown Dubai (AED 3.2M)',
    text: "Hi, I saw your listing on Property Finder for the 2BR in Downtown Dubai. Is it still available? My budget is around AED 3.2M.",
  },
  {
    id: 'bayut-en',
    badge: 'Bayut • Golden Visa',
    label: 'Off-plan 4BR Villa in Damac Hills (AED 4.5M)',
    text: "Hello, I found your agency on Bayut. Looking for a 4-bedroom off-plan villa around AED 4.5M that qualifies for the UAE Golden Visa.",
  },
  {
    id: 'meta-ar',
    badge: 'Meta Ad • العربية',
    label: 'Arabic Investor Inquiry (Business Bay / Downtown)',
    text: "مرحباً، أبحث عن شقة غرفتين في الخليج التجاري أو وسط مدينة دبي بميزانية ٣.٥ مليون درهم للاستثمار.",
  },
  {
    id: 'penthouse-en',
    badge: 'Direct • Luxury',
    label: 'Ultra-Luxury Penthouse Video Walkthrough',
    text: "Hi, I'm an international buyer looking for a ready penthouse in Business Bay up to AED 25M. Can we arrange a video walkthrough?",
  },
];

export function LiveDemoModal({
  defaultPhone,
  propertyContext,
  buttonVariant = 'primary',
  buttonLabel = 'Test live AI bot',
}: LiveDemoModalProps) {
  const [open, setOpen] = useState(false);
  const [botNumber, setBotNumber] = useState(() => getWhatsAppBotNumber(defaultPhone));
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('balos_demo_wa_number');
      if (saved) {
        setBotNumber(saved);
      } else if (defaultPhone) {
        setBotNumber(getWhatsAppBotNumber(defaultPhone));
      }
    }
  }, [defaultPhone]);

  useEffect(() => {
    if (propertyContext) {
      setSelectedPrompt(
        `Hi, I'm interested in "${propertyContext.title}" in ${propertyContext.community} listed at ${propertyContext.priceFormatted}${
          propertyContext.permitNo ? ` (Permit #${propertyContext.permitNo})` : ''
        }. Is it available for a viewing?`
      );
    } else {
      setSelectedPrompt(PRESET_PROMPTS[0].text);
    }
  }, [propertyContext]);

  const handleNumberChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setBotNumber(clean);
    if (typeof window !== 'undefined' && clean) {
      window.localStorage.setItem('balos_demo_wa_number', clean);
    }
  };

  const cleanPhone = botNumber || '971500000000';
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(selectedPrompt)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
    waUrl
  )}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(waUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {buttonVariant === 'primary' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {buttonVariant === 'outline' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3.5 py-2 rounded-xl border border-creek/30 bg-creek-light/60 hover:bg-creek-light text-creek text-xs font-semibold inline-flex items-center gap-1.5 transition shrink-0"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {buttonVariant === 'card' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-1.5 px-3 rounded-lg bg-creek-light/70 hover:bg-creek-light text-creek border border-creek/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-creek-light text-creek flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-ink">
                    Live WhatsApp AI Demo
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Scan from any phone or open WhatsApp to test the 60-second qualification & booking flow live.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-seaglass transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              {/* Left 3 cols: Bot phone + Preset prompts */}
              <div className="md:col-span-3 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Connected WhatsApp AI Number (International digits)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-muted bg-seaglass px-2.5 py-2 rounded-xl border border-border">
                      +
                    </span>
                    <input
                      type="text"
                      value={botNumber}
                      onChange={(e) => handleNumberChange(e.target.value)}
                      placeholder="971500000000"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                    />
                  </div>
                  <p className="text-[10px] text-ink-muted mt-1">
                    Saved in your browser for live prospect demos.
                  </p>
                </div>

                {!propertyContext && (
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Choose a test scenario (English or Arabic)
                    </label>
                    <div className="space-y-1.5">
                      {PRESET_PROMPTS.map((p) => {
                        const active = selectedPrompt === p.text;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPrompt(p.text)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                              active
                                ? 'border-creek bg-creek-light/50 text-ink'
                                : 'border-border bg-surface-pure hover:bg-seaglass/50 text-ink-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-semibold text-ink">{p.label}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-creek font-semibold">
                                {p.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-muted line-clamp-1">{p.text}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Pre-filled WhatsApp enquiry message
                  </label>
                  <textarea
                    rows={3}
                    value={selectedPrompt}
                    onChange={(e) => setSelectedPrompt(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                  />
                </div>
              </div>

              {/* Right 2 cols: QR Code & Launch Actions */}
              <div className="md:col-span-2 bg-surface-subtle rounded-2xl border border-border p-4 flex flex-col items-center justify-between text-center space-y-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-creek-light text-creek">
                    <Globe className="w-3 h-3" />
                    Scan on phone
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Ask the prospect to point their phone camera here during the call:
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-border shadow-xs">
                  <img
                    src={qrImageUrl}
                    alt="WhatsApp Live Bot QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>

                <div className="w-full space-y-2 pt-1">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <span>Open in WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 rounded-xl border border-border bg-surface hover:bg-seaglass text-xs font-medium text-ink flex items-center justify-center gap-1.5 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-creek" />
                        <span className="text-creek">Demo link copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-ink-muted" />
                        <span>Copy wa.me demo link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

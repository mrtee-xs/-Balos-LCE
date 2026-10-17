'use client';

import Link from 'next/link';
import { Lead, getQueueStatusBadge } from '../../lib/types';
import { formatDuration } from '../../lib/date';
import { ArrowRight, UserCheck, Clock } from 'lucide-react';
import { useLanguage } from '../layout/LanguageProvider';

interface NeedsYouSectionProps {
  pausedLeads: Lead[];
}

export function NeedsYouSection({ pausedLeads }: NeedsYouSectionProps) {
  const { t, isArabic } = useLanguage();

  const formatLeadBadge = (count: number) => {
    if (!isArabic) {
      return `${count} ${count === 1 ? 'lead' : 'leads'}`;
    }
    if (count === 0) return 'لا يوجد عملاء';
    if (count === 1) return 'عميل واحد';
    if (count === 2) return 'عميلان';
    if (count >= 3 && count <= 10) return `${count} عملاء`;
    return `${count} عميلًا`;
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          <h2 className="text-sm font-semibold text-ink font-heading">
            {t.overview.needsYou}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-coral-light text-coral font-medium">
            {formatLeadBadge(pausedLeads.length)}
          </span>
        </div>
        <Link
          href="/inbox"
          className="text-xs font-medium text-creek hover:underline flex items-center gap-1"
        >
          {t.overview.viewAll}
          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      </div>

      {pausedLeads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
          <div className="w-10 h-10 rounded-full bg-seaglass flex items-center justify-center text-creek mb-2">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-ink">{t.overview.allHandledByAi}</p>
          <p className="text-[11px] text-ink-muted mt-0.5 max-w-xs">
            {t.overview.allHandledByAiDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {pausedLeads.slice(0, 5).map((lead) => {
            const waitTime = formatDuration(lead.handoff_at || lead.last_lead_message_at || lead.updated_at);
            const badge = getQueueStatusBadge(lead);

            return (
              <Link
                key={lead.id}
                href={`/inbox?lead=${lead.id}`}
                className="group block p-3 rounded-xl border border-border/70 hover:border-coral/40 hover:bg-coral-light/20 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate group-hover:text-coral transition">
                      {lead.full_name && lead.full_name !== '.' ? lead.full_name : 'Direct WhatsApp Lead'}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {lead.e164_phone || lead.whatsapp_id || 'No phone'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-coral shrink-0 bg-coral-light px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    <span>{waitTime}</span>
                  </div>
                </div>

                {badge && (
                  <div className="mt-1.5">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        badge.variant === 'paused'
                          ? 'bg-coral-light text-coral'
                          : 'bg-saffron-light text-saffron-hover'
                      }`}
                    >
                      {badge.label}
                    </span>
                  </div>
                )}

                {lead.handoff_reason && (
                  <p className="text-[11px] text-ink-muted mt-1.5 line-clamp-1 italic bg-surface-subtle px-2 py-1 rounded">
                    "{lead.handoff_reason}"
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

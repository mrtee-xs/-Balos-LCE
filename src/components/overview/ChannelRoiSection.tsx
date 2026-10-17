'use client';

import React from 'react';
import Link from 'next/link';
import {
  Lead,
  Booking,
  LEAD_SOURCE_OPTIONS,
  isJunkOrSpamLead,
  getLeadEstimatedBudget,
} from '../../lib/types';
import { formatCompactAED } from '../../lib/utils';
import { ShieldAlert, Radio, ArrowRight } from 'lucide-react';
import { useLanguage } from '../layout/LanguageProvider';

interface ChannelRoiSectionProps {
  leads: Lead[];
  bookings: Booking[];
}

export function ChannelRoiSection({ leads, bookings }: ChannelRoiSectionProps) {
  const { t, isArabic } = useLanguage();
  const bookedLeadIds = new Set(bookings.map((b) => b.lead_id));

  // Filter out junk leads for active pipeline math, and count junk leads separately
  const junkLeads = leads.filter((l) => isJunkOrSpamLead(l));

  // Aggregate metrics per source channel
  const channelStats = LEAD_SOURCE_OPTIONS.map((channel) => {
    const channelLeads = leads.filter((l) => {
      const src = (l.source || 'DIRECT_WHATSAPP').toUpperCase().trim();
      return src === channel.value;
    });

    const qualifiedCount = channelLeads.filter((l) =>
      ['QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON'].includes(
        l.stage
      )
    ).length;

    const viewingsCount = channelLeads.filter(
      (l) => l.stage === 'VIEWING_SCHEDULED' || bookedLeadIds.has(l.id) || Boolean(l.viewing_at)
    ).length;

    const pipelineAed = channelLeads
      .filter((l) => l.stage !== 'CLOSED_LOST' && !isJunkOrSpamLead(l))
      .reduce((sum, l) => sum + getLeadEstimatedBudget(l), 0);

    return {
      ...channel,
      total: channelLeads.length,
      qualified: qualifiedCount,
      viewings: viewingsCount,
      pipelineAed,
    };
  });

  // Sort channels with activity first, keeping standard order for ties
  const sortedChannels = [...channelStats].sort((a, b) => b.total - a.total);

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-creek" />
            <h2 className="text-sm font-semibold text-ink font-heading">
              {isArabic ? 'عائد القنوات ومصادر العملاء' : 'Lead source & channel ROI'}
            </h2>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            {isArabic
              ? 'الطلبات، ونسبة التأهيل، والمعاينات المجدولة، وقيمة الصفقات عبر المنصات والإعلانات'
              : 'Enquiries, qualification rate, booked viewings, and pipeline value across portals & ads'}
          </p>
        </div>

        {/* Visible Junk Filtering Pill */}
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-seaglass hover:bg-border/50 border border-border text-xs text-ink transition self-start sm:self-auto"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-creek shrink-0" />
          <span>
            <strong className="font-semibold text-ink">{junkLeads.length}</strong>{' '}
            {isArabic
              ? 'طلب غير جاد تم حظره وتصفيته عن هواتف المستشارين'
              : 'low-intent / spam enquiries filtered from agent phones'}
          </span>
          <ArrowRight className="w-3 h-3 text-ink-muted rtl:rotate-180" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right text-xs text-ink">
          <thead className="bg-surface-subtle border-y border-border text-[11px] text-ink-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-2.5 px-3">{isArabic ? 'القناة' : 'Channel'}</th>
              <th className="py-2.5 px-3 text-right rtl:text-left">{isArabic ? 'الطلبات' : 'Enquiries'}</th>
              <th className="py-2.5 px-3 text-right rtl:text-left">{isArabic ? 'المؤهلون' : 'Qualified / Warm'}</th>
              <th className="py-2.5 px-3 text-right rtl:text-left">{isArabic ? 'المعاينات' : 'Viewings'}</th>
              <th className="py-2.5 px-3 text-right rtl:text-left">
                {isArabic ? 'الصفقات المتوقعة (درهم)' : 'Est. Pipeline (AED)'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedChannels.map((ch) => (
              <tr key={ch.value} className="hover:bg-seaglass/30 transition">
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${ch.badgeClass}`}
                  >
                    {t.sources[ch.value as keyof typeof t.sources] || ch.label}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right rtl:text-left font-semibold text-ink">
                  {ch.total}
                </td>
                <td className="py-2.5 px-3 text-right rtl:text-left">
                  <span className="font-semibold text-creek">{ch.qualified}</span>
                  {ch.total > 0 && (
                    <span className="text-[10px] text-ink-muted ml-1 rtl:ml-0 rtl:mr-1">
                      ({Math.round((ch.qualified / ch.total) * 100)}%)
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right rtl:text-left font-medium text-ink">
                  {ch.viewings}
                </td>
                <td className="py-2.5 px-3 text-right rtl:text-left font-bold font-heading text-ink whitespace-nowrap">
                  {ch.pipelineAed > 0 ? `${formatCompactAED(ch.pipelineAed)}${isArabic ? ' درهم' : ''}` : isArabic ? '— درهم' : 'AED —'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

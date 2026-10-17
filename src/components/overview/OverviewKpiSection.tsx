'use client';

import React from 'react';
import { useLanguage } from '../layout/LanguageProvider';
import { LiveDemoModal } from './LiveDemoModal';
import { formatCompactAED } from '../../lib/utils';
import {
  Sparkles,
  Moon,
  Globe,
  TrendingUp,
  CalendarCheck,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface OverviewKpiSectionProps {
  conversationsThisWeekCount: number;
  medianFirstReplyString: string;
  afterHoursAnsweredCount: number;
  afterHoursLeadsCount: number;
  defaultBotPhone: string | null;
  estimatedPipelineAed: number;
  estimatedCommissionAed: number;
  activePipelineLeadsCount: number;
  qualifiedLeads: number;
  viewingsBooked: number;
  upcomingBookingsCount: number;
  hoursSavedDisplay: string;
  junkFilteredCount: number;
  queueLeadsCount: number;
}

export function OverviewKpiSection({
  conversationsThisWeekCount,
  medianFirstReplyString,
  afterHoursAnsweredCount,
  afterHoursLeadsCount,
  defaultBotPhone,
  estimatedPipelineAed,
  estimatedCommissionAed,
  activePipelineLeadsCount,
  qualifiedLeads,
  viewingsBooked,
  upcomingBookingsCount,
  hoursSavedDisplay,
  junkFilteredCount,
  queueLeadsCount,
}: OverviewKpiSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Top Headline Banner */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold font-heading text-ink tracking-tight">
                Your assistant answered{' '}
                <span className="underline decoration-border-strong underline-offset-4">
                  {conversationsThisWeekCount} conversations
                </span>{' '}
                this week. Median first reply:{' '}
                <span className="font-mono text-ink">
                  {medianFirstReplyString}
                </span>
                .
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5 bg-seaglass border border-border px-3 py-1 rounded-full font-medium text-ink">
                  <Moon className="w-3.5 h-3.5 text-ink" />
                  {afterHoursAnsweredCount} messages ({afterHoursLeadsCount} leads) answered outside Dubai office hours
                </span>
                <span className="inline-flex items-center gap-1.5 bg-surface-subtle border border-border text-ink-muted px-3 py-1 rounded-full font-medium">
                  <Globe className="w-3.5 h-3.5 text-ink" />
                  Multilingual AI • 24/7 Dubai GST
                </span>
              </div>
            </div>
          </div>

          {/* Live WhatsApp Bot Demo Trigger */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <LiveDemoModal
              defaultPhone={defaultBotPhone}
              buttonVariant="primary"
              buttonLabel={t.settings.testLiveBot}
            />
          </div>
        </div>
      </div>

      {/* 6-Card ROI & Operational KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Estimated Pipeline (AED) */}
        <div className="bg-ink text-white rounded-2xl border border-ink p-4 shadow-sm">
          <div className="flex items-center justify-between text-white/75 mb-2">
            <span className="text-xs font-semibold">Est. pipeline</span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-xl font-bold font-heading text-white whitespace-nowrap">
            {estimatedPipelineAed > 0
              ? formatCompactAED(estimatedPipelineAed)
              : 'AED —'}
          </p>
          <p className="text-[11px] text-white/80 font-medium mt-1">
            {estimatedCommissionAed > 0
              ? `~${formatCompactAED(estimatedCommissionAed)} est. 2% comm.`
              : `Across ${activePipelineLeadsCount} active leads`}
          </p>
        </div>

        {/* 2. Qualified Leads */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Qualified leads</span>
            <Sparkles className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {qualifiedLeads}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Budget, area & timeline verified
          </p>
        </div>

        {/* 3. Viewings Booked */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Viewings booked</span>
            <CalendarCheck className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {viewingsBooked}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {upcomingBookingsCount > 0
              ? `${upcomingBookingsCount} upcoming in diary`
              : qualifiedLeads > 0
              ? `${qualifiedLeads} qualified ready to book`
              : 'Site visits & Zoom tours'}
          </p>
        </div>

        {/* 4. Leads Answered After Hours */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">After-hours leads</span>
            <Moon className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {afterHoursLeadsCount}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {afterHoursAnsweredCount} night & Sunday replies
          </p>
        </div>

        {/* 5. Hours & Junk Saved */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Agent time saved</span>
            <ShieldCheck className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {hoursSavedDisplay}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {junkFilteredCount} spam/cold leads filtered
          </p>
        </div>

        {/* 6. Handoffs Waiting */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Handoffs waiting</span>
            <Clock className="w-4 h-4 text-coral" />
          </div>
          <p
            className={`text-xl font-bold font-heading ${
              queueLeadsCount > 0 ? 'text-coral' : 'text-ink'
            }`}
          >
            {queueLeadsCount}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {queueLeadsCount > 0
              ? 'Requires agent attention'
              : 'AI operating autonomously'}
          </p>
        </div>
      </div>
    </div>
  );
}

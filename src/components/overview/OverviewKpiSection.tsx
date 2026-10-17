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
  const { t, isArabic } = useLanguage();

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
                {isArabic ? (
                  <>
                    أجاب مساعدك الذكي على{' '}
                    <span className="underline decoration-border-strong underline-offset-4">
                      {conversationsThisWeekCount} محادثة
                    </span>{' '}
                    هذا الأسبوع. وسيط زمن الرد الأول:{' '}
                    <span className="font-mono text-ink">
                      {medianFirstReplyString.replace('seconds', 'ثانية').replace('minutes', 'دقيقة')}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Your assistant answered{' '}
                    <span className="underline decoration-border-strong underline-offset-4">
                      {conversationsThisWeekCount} conversations
                    </span>{' '}
                    this week. Median first reply:{' '}
                    <span className="font-mono text-ink">
                      {medianFirstReplyString}
                    </span>
                    .
                  </>
                )}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5 bg-seaglass border border-border px-3 py-1 rounded-full font-medium text-ink">
                  <Moon className="w-3.5 h-3.5 text-ink" />
                  {isArabic
                    ? `تم الرد على ${afterHoursAnsweredCount} رسالة (${afterHoursLeadsCount} عميل) خارج أوقات الدوام الرسمي في دبي`
                    : `${afterHoursAnsweredCount} messages (${afterHoursLeadsCount} leads) answered outside Dubai office hours`}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-surface-subtle border border-border text-ink-muted px-3 py-1 rounded-full font-medium">
                  <Globe className="w-3.5 h-3.5 text-ink" />
                  English • العربية • Русский • 24/7 GST
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
        {/* 1. Estimated Pipeline (AED) — Apple Obsidian Highlight Card */}
        <div className="bg-ink text-white rounded-2xl border border-ink p-4 shadow-sm">
          <div className="flex items-center justify-between text-white/75 mb-2">
            <span className="text-xs font-semibold">
              {isArabic ? 'قيمة الصفقات المتوقعة' : 'Est. pipeline'}
            </span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-xl font-bold font-heading text-white whitespace-nowrap">
            {estimatedPipelineAed > 0
              ? `${formatCompactAED(estimatedPipelineAed)}${isArabic ? ' درهم' : ''}`
              : isArabic ? '— درهم' : 'AED —'}
          </p>
          <p className="text-[11px] text-white/80 font-medium mt-1">
            {estimatedCommissionAed > 0
              ? isArabic
                ? `~${formatCompactAED(estimatedCommissionAed)} عمولة متوقعة 2%`
                : `~${formatCompactAED(estimatedCommissionAed)} est. 2% comm.`
              : isArabic
              ? `ضمن ${activePipelineLeadsCount} عميل نشط`
              : `Across ${activePipelineLeadsCount} active leads`}
          </p>
        </div>

        {/* 2. Qualified Leads */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">
              {isArabic ? 'عملاء مؤهلون' : 'Qualified leads'}
            </span>
            <Sparkles className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {qualifiedLeads}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {isArabic ? 'الميزانية والمنطقة والجاهزية محددة' : 'Budget, area & timeline verified'}
          </p>
        </div>

        {/* 3. Viewings Booked */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">
              {isArabic ? 'معاينات مجدولة' : 'Viewings booked'}
            </span>
            <CalendarCheck className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {viewingsBooked}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {upcomingBookingsCount > 0
              ? isArabic
                ? `${upcomingBookingsCount} معاينة قادمة في التقويم`
                : `${upcomingBookingsCount} upcoming in diary`
              : qualifiedLeads > 0
              ? isArabic
                ? `${qualifiedLeads} مؤهلون جاهزون للحجز`
                : `${qualifiedLeads} qualified ready to book`
              : isArabic
              ? 'معاينات موقع واستشارات زووم'
              : 'Site visits & Zoom tours'}
          </p>
        </div>

        {/* 4. Leads Answered After Hours */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">
              {isArabic ? 'عملاء خارج الدوام' : 'After-hours leads'}
            </span>
            <Moon className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {afterHoursLeadsCount}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {isArabic
              ? `${afterHoursAnsweredCount} رد في المساء وأيام الأحد`
              : `${afterHoursAnsweredCount} night & Sunday replies`}
          </p>
        </div>

        {/* 5. Hours & Junk Saved */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">
              {isArabic ? 'الوقت الموفر للمستشارين' : 'Agent time saved'}
            </span>
            <ShieldCheck className="w-4 h-4 text-ink" />
          </div>
          <p className="text-xl font-bold font-heading text-ink">
            {isArabic ? hoursSavedDisplay.replace('hrs', 'ساعة').replace('mins', 'دقيقة') : hoursSavedDisplay}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {isArabic
              ? `تصفية ${junkFilteredCount} محادثة غير جادة`
              : `${junkFilteredCount} spam/cold leads filtered`}
          </p>
        </div>

        {/* 6. Handoffs Waiting */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">
              {isArabic ? 'بانتظار المستشار' : 'Handoffs waiting'}
            </span>
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
              ? isArabic
                ? 'يتطلب متابعة المستشار'
                : 'Requires agent attention'
              : isArabic
              ? 'المساعد يعمل باستقلالية تامة'
              : 'AI operating autonomously'}
          </p>
        </div>
      </div>
    </div>
  );
}

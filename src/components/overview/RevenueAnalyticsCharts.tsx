'use client';

import React, { useState, useMemo } from 'react';
import {
  Lead,
  Agent,
  Booking,
  isJunkOrSpamLead,
  getLeadEstimatedBudget,
  formatAgentRole,
} from '../../lib/types';
import { formatCompactAED } from '../../lib/utils';
import {
  TrendingUp,
  BarChart3,
  Layers,
  MapPin,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '../layout/LanguageProvider';

interface RevenueAnalyticsChartsProps {
  leads: Lead[];
  bookings: Booking[];
  agents?: Agent[];
}

type ChartTab = 'trajectory' | 'communities' | 'funnel';

export function RevenueAnalyticsCharts({
  leads,
  bookings,
  agents = [],
}: RevenueAnalyticsChartsProps) {
  const { isArabic } = useLanguage();
  const [activeTab, setActiveTab] = useState<ChartTab>('trajectory');
  const [hoveredBucketIdx, setHoveredBucketIdx] = useState<number | null>(null);

  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage !== 'CLOSED_LOST' && !isJunkOrSpamLead(l)),
    [leads]
  );

  // 1. Overall Financial Summary
  const financialSummary = useMemo(() => {
    const totalPipelineAed = activeLeads.reduce(
      (sum, l) => sum + getLeadEstimatedBudget(l),
      0
    );
    const qualifiedPipelineAed = activeLeads
      .filter((l) =>
        [
          'QUALIFIED',
          'VIEWING_SCHEDULED',
          'HANDOFF_TO_AGENT',
          'CLOSED_WON',
        ].includes(l.stage)
      )
      .reduce((sum, l) => sum + getLeadEstimatedBudget(l), 0);

    const closedWonAed = activeLeads
      .filter((l) => l.stage === 'CLOSED_WON')
      .reduce((sum, l) => sum + getLeadEstimatedBudget(l), 0);

    const leadsWithBudget = activeLeads.filter(
      (l) => getLeadEstimatedBudget(l) > 0
    );
    const avgDealSizeAed =
      leadsWithBudget.length > 0
        ? Math.round(totalPipelineAed / leadsWithBudget.length)
        : 0;

    const hotPipelineAed = activeLeads
      .filter((l) => l.temperature === 'HOT')
      .reduce((sum, l) => sum + getLeadEstimatedBudget(l), 0);
    const warmPipelineAed = activeLeads
      .filter((l) => l.temperature === 'WARM')
      .reduce((sum, l) => sum + getLeadEstimatedBudget(l), 0);
    const coldPipelineAed = Math.max(
      0,
      totalPipelineAed - hotPipelineAed - warmPipelineAed
    );

    return {
      totalPipelineAed,
      totalCommissionAed: Math.round(totalPipelineAed * 0.02),
      qualifiedPipelineAed,
      qualifiedCommissionAed: Math.round(qualifiedPipelineAed * 0.02),
      closedWonAed,
      avgDealSizeAed,
      hotPipelineAed,
      warmPipelineAed,
      coldPipelineAed,
    };
  }, [activeLeads]);

  // 2. Time-Series / Cohort Buckets for Revenue Trajectory Graph
  const trajectoryBuckets = useMemo(() => {
    // Sort active leads chronologically by created_at
    const sorted = [...activeLeads].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Group by date label (or create 6 progressive cohorts if leads are on the same day)
    const dateGroups = new Map<
      string,
      { label: string; pipelineAed: number; qualifiedAed: number; count: number }
    >();

    sorted.forEach((l) => {
      const d = new Date(l.created_at || Date.now());
      const key = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      });
      const existing = dateGroups.get(key) || {
        label: key,
        pipelineAed: 0,
        qualifiedAed: 0,
        count: 0,
      };
      const budget = getLeadEstimatedBudget(l);
      existing.pipelineAed += budget;
      if (
        [
          'QUALIFIED',
          'VIEWING_SCHEDULED',
          'HANDOFF_TO_AGENT',
          'CLOSED_WON',
        ].includes(l.stage)
      ) {
        existing.qualifiedAed += budget;
      }
      existing.count += 1;
      dateGroups.set(key, existing);
    });

    let rawBuckets = Array.from(dateGroups.values());

    // If fewer than 5 distinct dates exist, build a 6-step cumulative progression across leads
    if (rawBuckets.length < 5 && sorted.length > 0) {
      const steps = Math.min(6, Math.max(sorted.length, 4));
      const chunkSize = Math.max(1, Math.ceil(sorted.length / steps));
      rawBuckets = [];
      for (let i = 0; i < sorted.length; i += chunkSize) {
        const slice = sorted.slice(0, i + chunkSize);
        const lastLead = slice[slice.length - 1];
        const d = new Date(lastLead.created_at || Date.now());
        const label = `${d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        })} #${ rawBuckets.length + 1 }`;
        const pipelineAed = slice.reduce(
          (s, item) => s + getLeadEstimatedBudget(item),
          0
        );
        const qualifiedAed = slice
          .filter((item) =>
            [
              'QUALIFIED',
              'VIEWING_SCHEDULED',
              'HANDOFF_TO_AGENT',
              'CLOSED_WON',
            ].includes(item.stage)
          )
          .reduce((s, item) => s + getLeadEstimatedBudget(item), 0);

        rawBuckets.push({
          label,
          pipelineAed,
          qualifiedAed,
          count: slice.length,
        });
      }
    } else {
      // Make cumulative so the trajectory clearly shows pipeline buildup
      let runningPipeline = 0;
      let runningQualified = 0;
      let runningCount = 0;
      rawBuckets = rawBuckets.slice(-8).map((b) => {
        runningPipeline += b.pipelineAed;
        runningQualified += b.qualifiedAed;
        runningCount += b.count;
        return {
          label: b.label,
          pipelineAed: runningPipeline,
          qualifiedAed: runningQualified,
          count: runningCount,
        };
      });
    }

    return rawBuckets.map((b) => ({
      ...b,
      commissionAed: Math.round(b.pipelineAed * 0.02),
    }));
  }, [activeLeads]);

  // 3. Revenue by Dubai Community
  const communityStats = useMemo(() => {
    const map = new Map<
      string,
      { community: string; leadsCount: number; pipelineAed: number; hotCount: number }
    >();

    activeLeads.forEach((l) => {
      const communities =
        l.target_communities && l.target_communities.length > 0
          ? l.target_communities
          : ['Unspecified / General Dubai'];
      const budget = getLeadEstimatedBudget(l);

      communities.forEach((comm) => {
        const clean = comm.trim();
        const item = map.get(clean) || {
          community: clean,
          leadsCount: 0,
          pipelineAed: 0,
          hotCount: 0,
        };
        item.leadsCount += 1;
        item.pipelineAed += budget;
        if (l.temperature === 'HOT' || l.stage === 'QUALIFIED' || l.stage === 'VIEWING_SCHEDULED') {
          item.hotCount += 1;
        }
        map.set(clean, item);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.pipelineAed - a.pipelineAed || b.leadsCount - a.leadsCount)
      .slice(0, 7);
  }, [activeLeads]);

  // 4. Conversion Funnel & Agent Workload
  const funnelSteps = useMemo(() => {
    const stages = [
      {
        label: 'All Active Inquiries',
        filter: (l: Lead) => l.stage !== 'CLOSED_LOST',
      },
      {
        label: 'AI Engaged & Qualifying',
        filter: (l: Lead) =>
          [
            'ENGAGED',
            'QUALIFIED',
            'VIEWING_SCHEDULED',
            'HANDOFF_TO_AGENT',
            'CLOSED_WON',
          ].includes(l.stage),
      },
      {
        label: 'Qualified Buyer (Budget & Area)',
        filter: (l: Lead) =>
          [
            'QUALIFIED',
            'VIEWING_SCHEDULED',
            'HANDOFF_TO_AGENT',
            'CLOSED_WON',
          ].includes(l.stage),
      },
      {
        label: 'Viewing Scheduled / Handoff',
        filter: (l: Lead) =>
          ['VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON'].includes(
            l.stage
          ) || Boolean(l.viewing_at),
      },
    ];

    const baseCount = Math.max(activeLeads.length, 1);
    return stages.map((st) => {
      const matched = activeLeads.filter(st.filter);
      const aed = matched.reduce((s, l) => s + getLeadEstimatedBudget(l), 0);
      return {
        label: st.label,
        count: matched.length,
        pct: Math.round((matched.length / baseCount) * 100),
        aed,
      };
    });
  }, [activeLeads]);

  const agentWorkload = useMemo(() => {
    return agents
      .filter((a) => a.is_active)
      .map((ag) => {
        const assigned = activeLeads.filter(
          (l) => l.assigned_agent_id === ag.id
        );
        const pipelineAed = assigned.reduce(
          (s, l) => s + getLeadEstimatedBudget(l),
          0
        );
        return {
          agent: ag,
          leadsCount: assigned.length,
          pipelineAed,
          commissionAed: Math.round(pipelineAed * 0.02),
        };
      })
      .sort((a, b) => b.pipelineAed - a.pipelineAed || b.leadsCount - a.leadsCount);
  }, [agents, activeLeads]);

  // SVG Chart Geometry Calculations
  const maxTrajectoryAed = Math.max(
    ...trajectoryBuckets.map((b) => b.pipelineAed),
    1
  );
  const svgWidth = 640;
  const svgHeight = 210;
  const padX = 24;
  const padY = 22;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padY * 2;

  const points = trajectoryBuckets.map((b, i) => {
    const x =
      trajectoryBuckets.length === 1
        ? padX + plotW / 2
        : padX + (i / (trajectoryBuckets.length - 1)) * plotW;
    const y = padY + plotH - (b.pipelineAed / maxTrajectoryAed) * plotH;
    const qualY = padY + plotH - (b.qualifiedAed / maxTrajectoryAed) * plotH;
    return { x, y, qualY, bucket: b };
  });

  const linePath =
    points.length > 0
      ? points
          .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(' ')
      : '';
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
          padY + plotH
        ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padY + plotH).toFixed(1)} Z`
      : '';

  const qualLinePath =
    points.length > 0
      ? points
          .map(
            (p, idx) =>
              `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.qualY.toFixed(1)}`
          )
          .join(' ')
      : '';

  const activePoint =
    hoveredBucketIdx !== null && points[hoveredBucketIdx]
      ? points[hoveredBucketIdx]
      : points[points.length - 1] || null;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-5">
      {/* Top Header + Apple Segmented Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ink text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold font-heading text-ink tracking-tight">
              {isArabic
                ? 'تحليلات الإيرادات والصفقات وعمولات الوساطة'
                : 'Revenue, Pipeline & Brokerage Commission Analytics'}
            </h2>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            {isArabic
              ? 'حجم ميزانيات المشترين بالدرهم، عمولة الوساطة التقديرية 2%، وسرعة دوران الصفقات'
              : 'Real-time AED buyer budget volume, estimated 2% DLD brokerage commission, and community velocity'}
          </p>
        </div>

        {/* Apple-style Segmented Pill Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-seaglass border border-border self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('trajectory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              activeTab === 'trajectory'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isArabic ? 'مسار الإيرادات' : 'Revenue trajectory'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('communities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              activeTab === 'communities'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isArabic ? 'حسب المنطقة' : 'By community'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('funnel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              activeTab === 'funnel'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isArabic ? 'المسار وحمل الفريق' : 'Funnel & team load'}</span>
          </button>
        </div>
      </div>

      {/* Summary Financial Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span>{isArabic ? 'إجمالي الصفقات الجارية' : 'Total Pipeline in Play'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink rtl:rotate-270" />
          </div>
          <p className="text-lg font-bold font-heading text-ink mt-1">
            {financialSummary.totalPipelineAed > 0
              ? formatCompactAED(financialSummary.totalPipelineAed)
              : 'AED 0'}
          </p>
          <p className="text-[11px] text-ink-soft mt-0.5">
            {isArabic
              ? `عبر ${activeLeads.length} عميل نشط ومؤكد`
              : `Across ${activeLeads.length} active non-spam leads`}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-ink text-white border border-ink">
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <span>{isArabic ? 'عمولة الوكالة المتوقعة (2%)' : 'Projected 2% Commission'}</span>
            <span className="px-1.5 py-0.2 rounded bg-white/15 text-[10px] font-mono text-white">
              2.0%
            </span>
          </div>
          <p className="text-lg font-bold font-heading text-white mt-1">
            {financialSummary.totalCommissionAed > 0
              ? formatCompactAED(financialSummary.totalCommissionAed)
              : 'AED 0'}
          </p>
          <p className="text-[11px] text-white/75 mt-0.5">
            {isArabic
              ? (financialSummary.qualifiedCommissionAed > 0
                  ? `منها ${formatCompactAED(financialSummary.qualifiedCommissionAed)} من مشترين مؤهلين`
                  : 'النسبة القياسية للوساطة في دبي')
              : (financialSummary.qualifiedCommissionAed > 0
                  ? `${formatCompactAED(financialSummary.qualifiedCommissionAed)} from qualified buyers`
                  : 'Standard Dubai agency fee')}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span>{isArabic ? 'حجم المشترين المؤهلين' : 'Qualified Buyer Volume'}</span>
            <span className="text-[10px] font-semibold text-ink">
              {financialSummary.totalPipelineAed > 0
                ? `${Math.round(
                    (financialSummary.qualifiedPipelineAed /
                      financialSummary.totalPipelineAed) *
                      100
                  )}%`
                : '0%'}
            </span>
          </div>
          <p className="text-lg font-bold font-heading text-ink mt-1">
            {financialSummary.qualifiedPipelineAed > 0
              ? formatCompactAED(financialSummary.qualifiedPipelineAed)
              : 'AED 0'}
          </p>
          <p className="text-[11px] text-ink-soft mt-0.5">
            {isArabic
              ? 'تم التحقق من الميزانية والموقع والإطار الزمني'
              : 'Verified budget, area & timeline'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span>{isArabic ? 'متوسط ميزانية المشتري' : 'Avg. Buyer Budget'}</span>
            <span className="text-[10px] font-mono text-ink-soft">
              {isArabic ? 'المتوسط' : 'MEAN'}
            </span>
          </div>
          <p className="text-lg font-bold font-heading text-ink mt-1">
            {financialSummary.avgDealSizeAed > 0
              ? formatCompactAED(financialSummary.avgDealSizeAed)
              : 'AED —'}
          </p>
          <p className="text-[11px] text-ink-soft mt-0.5">
            {isArabic
              ? `~${formatCompactAED(Math.round(financialSummary.avgDealSizeAed * 0.02))} عمولة متوقعة لكل صفقة`
              : `~${formatCompactAED(Math.round(financialSummary.avgDealSizeAed * 0.02))} commission per deal`}
          </p>
        </div>
      </div>

      {/* TAB 1: Revenue & Commission Trajectory Graph */}
      {activeTab === 'trajectory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
          {/* Main Interactive SVG Area & Line Chart */}
          <div className="lg:col-span-2 p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  {isArabic
                    ? 'المنحنى التراكمي لإجمالي الصفقات والمشترين المؤهلين'
                    : 'Cumulative Pipeline & Qualified Revenue Curve'}
                </h3>
                {activePoint && (
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-sm font-bold text-ink">
                      {formatCompactAED(activePoint.bucket.pipelineAed)}{' '}
                      {isArabic ? 'إجمالي' : 'total'}
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">
                      • {formatCompactAED(activePoint.bucket.qualifiedAed)}{' '}
                      {isArabic ? 'مؤهل' : 'qualified'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-seaglass border border-border text-[11px] font-semibold text-ink">
                      {isArabic ? 'عمولة تقديرية' : 'Est. Comm'}:{' '}
                      {formatCompactAED(activePoint.bucket.commissionAed)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-ink inline-block" />
                  {isArabic ? 'إجمالي الصفقات' : 'Total Pipeline'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-ink-soft border-b border-dashed border-ink-muted inline-block" />
                  {isArabic ? 'حجم المؤهلين' : 'Qualified Volume'}
                </span>
              </div>
            </div>

            {points.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-ink-muted">
                {isArabic
                  ? 'لا توجد بيانات ميزانية مسجلة حتى الآن.'
                  : 'No budget data recorded yet.'}
              </div>
            ) : (
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-52 overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="appleMonochromeFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#1D1D1F" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#1D1D1F" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.5, 1].map((ratio, idx) => {
                    const y = padY + ratio * plotH;
                    const val = Math.round(maxTrajectoryAed * (1 - ratio));
                    return (
                      <g key={idx}>
                        <line
                          x1={padX}
                          y1={y}
                          x2={svgWidth - padX}
                          y2={y}
                          stroke="#E5E5EA"
                          strokeDasharray={idx === 2 ? undefined : '3 3'}
                          strokeWidth="1"
                        />
                        <text
                          x={padX}
                          y={y - 5}
                          fill="#86868B"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {val > 0 ? formatCompactAED(val) : 'AED 0'}
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Area under Total Pipeline */}
                  <path d={areaPath} fill="url(#appleMonochromeFill)" />

                  {/* Qualified Pipeline Dashed Line */}
                  <path
                    d={qualLinePath}
                    fill="none"
                    stroke="#86868B"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Main Total Pipeline Solid Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#111113"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Data Points */}
                  {points.map((p, idx) => {
                    const isHovered =
                      hoveredBucketIdx === idx ||
                      (hoveredBucketIdx === null && idx === points.length - 1);
                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredBucketIdx(idx)}
                        onMouseLeave={() => setHoveredBucketIdx(null)}
                      >
                        {isHovered && (
                          <line
                            x1={p.x}
                            y1={padY}
                            x2={p.x}
                            y2={padY + plotH}
                            stroke="#1D1D1F"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 5 : 3.5}
                          fill={isHovered ? '#111113' : '#FFFFFF'}
                          stroke="#111113"
                          strokeWidth="2"
                        />
                        <text
                          x={p.x}
                          y={svgHeight - 4}
                          textAnchor="middle"
                          fill={isHovered ? '#1D1D1F' : '#86868B'}
                          fontSize="9.5"
                          fontWeight={isHovered ? '700' : '500'}
                        >
                          {p.bucket.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Right Column: Buyer Temperature Revenue Split */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {isArabic
                  ? 'الصفقات حسب جاهزية المشتري'
                  : 'Pipeline by Buyer Intent'}
              </h3>
              <p className="text-[11px] text-ink-soft mt-0.5">
                {isArabic
                  ? 'توزيع الميزانيات بالدرهم حسب تصنيف الذكاء الاصطناعي'
                  : 'AED budget concentration by AI qualification temperature'}
              </p>
            </div>

            <div className="space-y-3.5 my-auto">
              {[
                {
                  label: isArabic
                    ? 'مشترون جاهزون (للمعاينة أو تقديم عرض)'
                    : 'Hot Buyers (Ready to view/offer)',
                  aed: financialSummary.hotPipelineAed,
                  barClass: 'bg-ink',
                  dotClass: 'bg-ink',
                },
                {
                  label: isArabic
                    ? 'مشترون جادون (قيد التأهيل)'
                    : 'Warm Buyers (Active qualification)',
                  aed: financialSummary.warmPipelineAed,
                  barClass: 'bg-[#636366]',
                  dotClass: 'bg-[#636366]',
                },
                {
                  label: isArabic
                    ? 'استفسارات أولية'
                    : 'Early / Cold Inquiries',
                  aed: financialSummary.coldPipelineAed,
                  barClass: 'bg-[#AEAEB2]',
                  dotClass: 'bg-[#AEAEB2]',
                },
              ].map((tier) => {
                const pct =
                  financialSummary.totalPipelineAed > 0
                    ? Math.round(
                        (tier.aed / financialSummary.totalPipelineAed) * 100
                      )
                    : 0;
                return (
                  <div key={tier.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                        <span
                          className={`w-2 h-2 rounded-full ${tier.dotClass}`}
                        />
                        {tier.label}
                      </span>
                      <span className="font-bold text-ink">
                        {tier.aed > 0 ? formatCompactAED(tier.aed) : 'AED 0'}{' '}
                        <span className="text-[10px] font-normal text-ink-soft">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-seaglass overflow-hidden border border-border/60">
                      <div
                        className={`h-full rounded-full ${tier.barClass} transition-all duration-300`}
                        style={{ width: `${Math.max(pct, tier.aed > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border/70 flex items-center justify-between text-[11px] text-ink-muted">
              <span>
                {isArabic ? 'المعاينات المجدولة في الأجندة' : 'Booked viewings in diary'}
              </span>
              <span className="font-bold text-ink">
                {isArabic ? `${bookings.length} معاينة` : `${bookings.length} viewings`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Revenue by Dubai Community Bar Graph */}
      {activeTab === 'communities' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {isArabic
                ? 'أكثر مناطق دبي طلباً حسب حجم ميزانيات الصفقات'
                : 'Top Requested Dubai Communities by AED Pipeline Volume'}
            </span>
            <span>
              {isArabic ? 'عمولة تقديرية (2%)' : 'Est. 2% Commission'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {communityStats.map((item, idx) => {
              const maxCommAed = Math.max(
                communityStats[0]?.pipelineAed || 1,
                1
              );
              const barPct = Math.max(
                Math.round((item.pipelineAed / maxCommAed) * 100),
                item.leadsCount > 0 ? 6 : 0
              );
              const commAed = Math.round(item.pipelineAed * 0.02);

              return (
                <div
                  key={item.community}
                  className="p-3.5 rounded-xl bg-surface-subtle border border-border hover:border-border-strong transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-seaglass border border-border text-[10px] font-mono font-bold text-ink flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <MapPin className="w-3.5 h-3.5 text-ink-soft" />
                      <span className="text-xs font-bold text-ink">
                        {item.community}
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-seaglass text-[10px] font-medium text-ink-muted">
                        {item.leadsCount}{' '}
                        {isArabic
                          ? (item.leadsCount === 1 ? 'مشترٍ' : 'مشترين')
                          : (item.leadsCount === 1 ? 'buyer' : 'buyers')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-ink">
                        {item.pipelineAed > 0
                          ? formatCompactAED(item.pipelineAed)
                          : (isArabic ? 'الميزانية قيد التحديد' : 'Budget TBD')}
                      </span>
                      <span className="text-[11px] font-mono text-ink-muted bg-seaglass px-2 py-0.5 rounded border border-border">
                        ~{commAed > 0 ? formatCompactAED(commAed) : 'AED 0'}{' '}
                        {isArabic ? 'عمولة' : 'comm.'}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-seaglass overflow-hidden">
                    <div
                      className="h-full rounded-full bg-ink transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Conversion Funnel & Sales Leadership Workload */}
      {activeTab === 'funnel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
          {/* Left: Stage Revenue Funnel */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {isArabic
                  ? 'مسار التحويل المرحلي والميزانيات بالدرهم'
                  : 'Stage-by-Stage Conversion & AED Funnel'}
              </h3>
              <p className="text-[11px] text-ink-soft mt-0.5">
                {isArabic
                  ? 'كيف تتحول استفسارات واتساب إلى معاينات وصفقات'
                  : 'How WhatsApp enquiries convert into qualified viewings'}
              </p>
            </div>

            <div className="space-y-3">
              {funnelSteps.map((step, i) => {
                const stepLabel = isArabic
                  ? (step.label === 'All Active Inquiries'
                      ? 'كافة الاستفسارات النشطة'
                      : step.label === 'AI Engaged & Qualifying'
                      ? 'تفاعل وتأهيل الذكاء الاصطناعي'
                      : step.label === 'Qualified Buyer (Budget & Area)'
                      ? 'مشترون مؤهلون (الميزانية والموقع)'
                      : step.label === 'Viewing Scheduled / Handoff'
                      ? 'معاينة مجدولة / إحالة لمستشار'
                      : step.label)
                  : step.label;

                return (
                  <div key={step.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">
                        {i + 1}. {stepLabel}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">
                          {step.count}{' '}
                          {isArabic ? 'عميل' : 'leads'}{' '}
                          ({step.pct}%)
                        </span>
                        <span className="text-[11px] font-mono text-ink-muted">
                          • {step.aed > 0 ? formatCompactAED(step.aed) : 'AED 0'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-seaglass overflow-hidden border border-border/60">
                      <div
                        className={`h-full rounded-full bg-ink transition-all duration-300`}
                        style={{ width: `${Math.max(step.pct, step.count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Sales Leadership Team Workload Distribution */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-ink" />
                  <span>
                    {isArabic
                      ? 'توزيع الصفقات على المستشارين'
                      : 'Agent Pipeline Distribution'}
                  </span>
                </h3>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  {isArabic
                    ? 'العملاء النشطون وحجم الميزانيات المسندة'
                    : 'Active leads & AED volume assigned by Sales Leadership'}
                </p>
              </div>
            </div>

            {agentWorkload.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                {isArabic
                  ? 'لا يوجد مستشارون نشطون حالياً.'
                  : 'No active agents found.'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {agentWorkload.map((row) => (
                  <div
                    key={row.agent.id}
                    className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {row.agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">
                          {row.agent.name}
                        </p>
                        <p className="text-[10px] text-ink-soft">
                          {formatAgentRole(row.agent.role)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right rtl:text-left shrink-0">
                      <p className="text-xs font-bold text-ink">
                        {row.pipelineAed > 0
                          ? formatCompactAED(row.pipelineAed)
                          : 'AED 0'}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {row.leadsCount}{' '}
                        {isArabic
                          ? 'عميل مسند'
                          : (row.leadsCount === 1 ? 'assigned lead' : 'assigned leads')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

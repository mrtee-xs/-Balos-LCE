'use client';

import React from 'react';
import Link from 'next/link';
import {
  Lead,
  Booking,
  Agent,
  isLeadInQueue,
  getLeadEstimatedBudget,
} from '../../lib/types';
import { formatCompactAED } from '../../lib/utils';
import { PipelineStrip } from './PipelineStrip';
import { NeedsYouSection } from './NeedsYouSection';
import { UpcomingViewingsSection } from './UpcomingViewingsSection';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AgentPersonalOverviewProps {
  agent: Agent | null;
  leads: Lead[];
  bookings: Booking[];
  medianReplyString?: string;
}

export function AgentPersonalOverview({
  agent,
  leads,
  bookings,
  medianReplyString = '< 1 minute',
}: AgentPersonalOverviewProps) {
  const nowIso = new Date().toISOString();

  // 1. My upcoming bookings
  const upcomingBookings = bookings.filter(
    (b) => !b.scheduled_at || b.scheduled_at >= nowIso
  );

  // 2. Personal Queue leads (handoffs or AI paused needing agent reply)
  const queueLeads = leads
    .filter((l) => isLeadInQueue(l))
    .sort((a, b) => {
      const timeA = new Date(
        a.handoff_at || a.last_lead_message_at || a.updated_at
      ).getTime();
      const timeB = new Date(
        b.handoff_at || b.last_lead_message_at || b.updated_at
      ).getTime();
      return timeA - timeB;
    });

  // 3. Qualified leads
  const qualifiedCount = leads.filter((l) =>
    ['QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON'].includes(
      l.stage
    )
  ).length;

  // 4. Closed Won
  const closedWonLeads = leads.filter((l) => l.stage === 'CLOSED_WON');
  const closedWonVolume = closedWonLeads.reduce(
    (sum, l) => sum + getLeadEstimatedBudget(l),
    0
  );

  // 5. Active Pipeline (AED) & Commission (~2%)
  const activeLeads = leads.filter((l) => l.stage !== 'CLOSED_LOST');
  const estimatedPipelineAed = activeLeads.reduce(
    (sum, l) => sum + getLeadEstimatedBudget(l),
    0
  );
  const estimatedCommissionAed = Math.round(estimatedPipelineAed * 0.02);

  // 6. Personal Stage Counts
  const stageCounts: Record<string, number> = {};
  for (const lead of leads) {
    const stage = lead.stage || 'NEW';
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Agent Welcome & Status Strip */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ink text-white">
              <Zap className="w-3 h-3 text-amber-300" />
              Agent Action Center
            </span>
            {agent?.rera_brn ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-seaglass text-ink border border-border">
                <ShieldCheck className="w-3 h-3 text-creek" />
                RERA BRN: {agent.rera_brn}
              </span>
            ) : (
              <Link
                href="/settings/profile"
                className="text-[10px] text-ink-muted hover:text-ink underline"
              >
                + Add RERA BRN in Profile
              </Link>
            )}
          </div>
          <h1 className="text-xl font-bold font-heading text-ink tracking-tight">
            {agent?.name ? `Welcome back, ${agent.name}` : 'My Agent Workspace'}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time conversion cockpit for your assigned WhatsApp leads, scheduled viewings, and pipeline
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inbox"
            className="px-4 py-2 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink-light transition flex items-center gap-2 shadow-xs"
          >
            <span>Open My Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 6-Card Personal KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Personal Pipeline Value */}
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-xs hover:border-ink/20 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">
              My Pipeline (AED)
            </span>
            <div className="w-8 h-8 rounded-xl bg-seaglass flex items-center justify-center text-ink">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-ink">
              {formatCompactAED(estimatedPipelineAed)}
            </span>
            <span className="text-[11px] text-ink-soft">active deals</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">
              ~{formatCompactAED(estimatedCommissionAed)}
            </span>
            <span>projected commission (~2%)</span>
          </p>
        </div>

        {/* 2. Needs You Action Queue */}
        <div
          className={`p-4 rounded-2xl border shadow-xs transition ${
            queueLeads.length > 0
              ? 'bg-coral-light/30 border-coral/30 hover:border-coral/50'
              : 'bg-surface border border-border hover:border-ink/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">
              Awaiting My Response
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                queueLeads.length > 0
                  ? 'bg-coral text-white'
                  : 'bg-seaglass text-ink'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-ink">
              {queueLeads.length}
            </span>
            <span className="text-[11px] text-ink-soft">
              {queueLeads.length === 1 ? 'client waiting' : 'clients waiting'}
            </span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5">
            {queueLeads.length > 0
              ? 'AI handoffs paused waiting for your message'
              : 'All assigned conversations current'}
          </p>
        </div>

        {/* 3. My Scheduled Viewings */}
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-xs hover:border-ink/20 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">
              My Viewings & Tours
            </span>
            <div className="w-8 h-8 rounded-xl bg-seaglass flex items-center justify-center text-ink">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-ink">
              {upcomingBookings.length}
            </span>
            <span className="text-[11px] text-ink-soft">upcoming</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5">
            {bookings.length} total scheduled to date
          </p>
        </div>

        {/* 4. My Assigned Leads & Qualification */}
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-xs hover:border-ink/20 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">
              Assigned Lead Roster
            </span>
            <div className="w-8 h-8 rounded-xl bg-seaglass flex items-center justify-center text-ink">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-ink">
              {leads.length}
            </span>
            <span className="text-[11px] text-ink-soft">total clients</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5 flex items-center gap-1">
            <span className="font-semibold text-ink">{qualifiedCount}</span>
            <span>high-intent / qualified</span>
          </p>
        </div>

        {/* 5. Response Velocity */}
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-xs hover:border-ink/20 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">
              Response Speed
            </span>
            <div className="w-8 h-8 rounded-xl bg-seaglass flex items-center justify-center text-ink">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-ink">
              {medianReplyString}
            </span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5">
            Backed by 24/7 instant WhatsApp AI co-pilot
          </p>
        </div>

        {/* 6. Closed Deals */}
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-xs hover:border-ink/20 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">
              Closed Won
            </span>
            <div className="w-8 h-8 rounded-xl bg-seaglass flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-emerald-700">
              {closedWonLeads.length}
            </span>
            <span className="text-[11px] text-ink-soft">
              ({formatCompactAED(closedWonVolume)})
            </span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5">
            Successful property transactions closed
          </p>
        </div>
      </div>

      {/* Personal Pipeline Funnel Strip */}
      <PipelineStrip stageCounts={stageCounts} totalLeads={leads.length} />

      {/* Two Column Grid: "Needs you" & "Upcoming viewings" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeedsYouSection pausedLeads={queueLeads} />
        <UpcomingViewingsSection viewings={upcomingBookings} />
      </div>
    </div>
  );
}

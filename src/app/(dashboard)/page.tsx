import { createClient } from '../../lib/supabase/server';
import { isOutsideDubaiBusinessHours } from '../../lib/date';
import { PipelineStrip } from '../../components/overview/PipelineStrip';
import { NeedsYouSection } from '../../components/overview/NeedsYouSection';
import { UpcomingViewingsSection } from '../../components/overview/UpcomingViewingsSection';
import { Lead, Booking, Message, isLeadInQueue } from '../../lib/types';
import {
  MessageSquare,
  Users,
  CalendarCheck,
  Clock,
  Sparkles,
  Moon,
} from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function OverviewPage() {
  const supabase = createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysIso = sevenDaysAgo.toISOString();

  // Run all queries in parallel with explicit column selections
  const [leadsRes, messagesRes, bookingsRes] = await Promise.all([
    supabase
      .from('leads')
      .select(
        'id, full_name, e164_phone, whatsapp_id, stage, temperature, lead_score, ai_paused, handoff_at, handoff_reason, updated_at, created_at, last_lead_message_at'
      )
      .order('created_at', { ascending: false }),

    supabase
      .from('messages')
      .select('lead_id, direction, sender, created_at')
      .gte('created_at', sevenDaysIso)
      .order('created_at', { ascending: true }),

    supabase
      .from('bookings')
      .select(`
        id,
        lead_id,
        property_id,
        scheduled_at,
        viewing_type,
        status,
        notes,
        meeting_link,
        created_at,
        lead:leads(id, full_name, e164_phone),
        property:properties(id, title, community)
      `)
      .order('scheduled_at', { ascending: true }),
  ]);

  const leads = (leadsRes.data || []) as unknown as Lead[];
  const messages = (messagesRes.data || []) as unknown as Message[];
  const allBookings: any[] = bookingsRes.data || [];

  const nowIso = new Date().toISOString();
  const upcomingBookings: Booking[] = allBookings.filter(
    (b) => !b.scheduled_at || b.scheduled_at >= nowIso
  );

  // --- Calculate Metrics ---

  // A. Leads created in the last 7 days
  const leadsThisWeek = leads.filter((l) => l.created_at >= sevenDaysIso).length;

  // B. Qualified leads
  const qualifiedLeads = leads.filter((l) => l.stage === 'QUALIFIED').length;

  // C. Viewings booked
  const viewingsBooked = allBookings.length;

  // D. Handoffs waiting (queue: stage = 'HANDOFF_TO_AGENT' OR ai_paused = true)
  const queueLeads = leads
    .filter((l) => isLeadInQueue(l))
    .sort((a, b) => {
      const timeA = new Date(a.handoff_at || a.last_lead_message_at || a.updated_at).getTime();
      const timeB = new Date(b.handoff_at || b.last_lead_message_at || b.updated_at).getTime();
      return timeA - timeB; // longest waiting first
    });

  // E. Group messages by lead_id to calculate median reply time and answered conversations
  const leadMessagesMap = new Map<string, Message[]>();
  for (const m of messages) {
    if (!leadMessagesMap.has(m.lead_id)) {
      leadMessagesMap.set(m.lead_id, []);
    }
    leadMessagesMap.get(m.lead_id)!.push(m);
  }

  // Median first-reply time (7 days):
  const replyDeltasInSeconds: number[] = [];
  const activeConversationLeads = new Set<string>();
  let afterHoursAnsweredCount = 0;

  leadMessagesMap.forEach((msgs, leadId) => {
    for (let i = 0; i < msgs.length; i++) {
      const current = msgs[i];

      // Check for INBOUND message from LEAD
      if (current.direction === 'INBOUND' || current.sender === 'LEAD') {
        // Look for next OUTGOING message with sender AI
        for (let j = i + 1; j < msgs.length; j++) {
          const next = msgs[j];
          if (next.direction === 'OUTGOING' && next.sender === 'AI') {
            const inboundTime = new Date(current.created_at).getTime();
            const outgoingTime = new Date(next.created_at).getTime();
            const diffSeconds = (outgoingTime - inboundTime) / 1000;

            activeConversationLeads.add(leadId);

            // Check if received outside 09:00 - 19:00 Mon-Sat Dubai time
            if (isOutsideDubaiBusinessHours(current.created_at)) {
              afterHoursAnsweredCount++;
            }

            // Ignore gaps over 1 hour (3600s) or negative
            if (diffSeconds >= 0 && diffSeconds <= 3600) {
              replyDeltasInSeconds.push(diffSeconds);
            }
            break; // found the next AI reply for this inbound message
          }
        }
      }
    }
  });

  // Calculate median
  let medianFirstReplyString = 'n/a';
  if (replyDeltasInSeconds.length > 0) {
    replyDeltasInSeconds.sort((a, b) => a - b);
    const mid = Math.floor(replyDeltasInSeconds.length / 2);
    const medianSec =
      replyDeltasInSeconds.length % 2 !== 0
        ? replyDeltasInSeconds[mid]
        : (replyDeltasInSeconds[mid - 1] + replyDeltasInSeconds[mid]) / 2;

    if (medianSec < 60) {
      medianFirstReplyString = `${Math.round(medianSec)} seconds`;
    } else {
      const m = Math.floor(medianSec / 60);
      const s = Math.round(medianSec % 60);
      medianFirstReplyString = s > 0 ? `${m}m ${s}s` : `${m} minutes`;
    }
  }

  // Answered conversations count this week
  const conversationsThisWeekCount =
    activeConversationLeads.size > 0
      ? activeConversationLeads.size
      : leads.filter((l) => l.created_at >= sevenDaysIso).length;

  // Pipeline stage counts
  const stageCounts: Record<string, number> = {};
  for (const lead of leads) {
    const stage = lead.stage || 'NEW';
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Top Headline Banner */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-creek-light text-creek flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-ink tracking-tight">
              Your assistant answered{' '}
              <span className="text-creek">{conversationsThisWeekCount} conversations</span>{' '}
              this week. Median first reply:{' '}
              <span className="text-creek">{medianFirstReplyString}</span>.
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5 bg-seaglass px-3 py-1 rounded-full font-medium">
                <Moon className="w-3.5 h-3.5 text-creek" />
                {afterHoursAnsweredCount} messages answered outside Dubai office hours
              </span>
              <span>• Operating in Asia/Dubai (GST)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads this week */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Leads this week</span>
            <Users className="w-4 h-4 text-ink-soft" />
          </div>
          <p className="text-2xl font-bold font-heading text-ink">
            {leadsThisWeek}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Total {leads.length} recorded leads
          </p>
        </div>

        {/* Qualified leads */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Qualified leads</span>
            <Sparkles className="w-4 h-4 text-creek" />
          </div>
          <p className="text-2xl font-bold font-heading text-creek">
            {qualifiedLeads}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Intent, budget & timeline verified
          </p>
        </div>

        {/* Viewings booked */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Viewings booked</span>
            <CalendarCheck className="w-4 h-4 text-saffron" />
          </div>
          <p className="text-2xl font-bold font-heading text-ink">
            {viewingsBooked}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {upcomingBookings.length} upcoming sessions
          </p>
        </div>

        {/* Handoffs waiting */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-medium">Handoffs waiting</span>
            <Clock className="w-4 h-4 text-coral" />
          </div>
          <p className={`text-2xl font-bold font-heading ${queueLeads.length > 0 ? 'text-coral' : 'text-ink'}`}>
            {queueLeads.length}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {queueLeads.length > 0 ? 'Requires agent attention' : 'AI operating autonomously'}
          </p>
        </div>
      </div>

      {/* Pipeline Strip */}
      <PipelineStrip stageCounts={stageCounts} totalLeads={leads.length} />

      {/* Two Column Grid: "Needs you" & "Upcoming viewings" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeedsYouSection pausedLeads={queueLeads} />
        <UpcomingViewingsSection viewings={upcomingBookings} />
      </div>
    </div>
  );
}

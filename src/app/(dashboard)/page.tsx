import { createClient } from '../../lib/supabase/server';
import { isOutsideDubaiBusinessHours } from '../../lib/date';
import { formatCompactAED } from '../../lib/utils';
import { PipelineStrip } from '../../components/overview/PipelineStrip';
import { RevenueAnalyticsCharts } from '../../components/overview/RevenueAnalyticsCharts';
import { ChannelRoiSection } from '../../components/overview/ChannelRoiSection';
import { NeedsYouSection } from '../../components/overview/NeedsYouSection';
import { UpcomingViewingsSection } from '../../components/overview/UpcomingViewingsSection';
import { LiveDemoModal } from '../../components/overview/LiveDemoModal';
import { OverviewKpiSection } from '../../components/overview/OverviewKpiSection';
import {
  Lead,
  Agent,
  Booking,
  Message,
  isLeadInQueue,
  isJunkOrSpamLead,
  getLeadEstimatedBudget,
} from '../../lib/types';
import {
  Users,
  CalendarCheck,
  Clock,
  Sparkles,
  Moon,
  TrendingUp,
  ShieldCheck,
  Globe,
} from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function OverviewPage() {
  const supabase = createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysIso = sevenDaysAgo.toISOString();

  // Run all queries in parallel using safe wildcard selection for leads & messages
  const [leadsRes, messagesRes, bookingsRes, bizRes, agentsRes] =
    await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('messages')
        .select('*')
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
          property:properties(id, title, community, category, images, video_url)
        `)
        .order('scheduled_at', { ascending: true }),

      supabase
        .from('business_info')
        .select('contact_phone')
        .limit(1)
        .maybeSingle(),

      supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true }),
    ]);

  const leads = (leadsRes.data || []) as unknown as Lead[];
  const messages = (messagesRes.data || []) as unknown as Message[];
  const allBookings: any[] = bookingsRes.data || [];
  const defaultBotPhone = bizRes.data?.contact_phone || null;
  const agents = (agentsRes.data || []) as unknown as Agent[];

  const nowIso = new Date().toISOString();
  const upcomingBookings: Booking[] = allBookings.filter(
    (b) => !b.scheduled_at || b.scheduled_at >= nowIso
  );

  // --- Calculate ROI & Operational Metrics ---

  // A. Leads created in the last 7 days
  const leadsThisWeek = leads.filter((l) => l.created_at >= sevenDaysIso).length;

  // B. Qualified & High-Intent leads
  const qualifiedLeads = leads.filter((l) =>
    ['QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON'].includes(
      l.stage
    )
  ).length;

  // C. Viewings booked (from bookings table OR leads with viewing_at / VIEWING_SCHEDULED)
  const leadsWithViewing = leads.filter(
    (l) => l.stage === 'VIEWING_SCHEDULED' || Boolean(l.viewing_at)
  ).length;
  const viewingsBooked = Math.max(allBookings.length, leadsWithViewing);

  // D. Estimated Pipeline (AED) & ~2% Brokerage Commission
  const activePipelineLeads = leads.filter(
    (l) => l.stage !== 'CLOSED_LOST' && !isJunkOrSpamLead(l)
  );
  const estimatedPipelineAed = activePipelineLeads.reduce(
    (sum, l) => sum + getLeadEstimatedBudget(l),
    0
  );
  const estimatedCommissionAed = Math.round(estimatedPipelineAed * 0.02);

  // E. Junk / Spam Filtered Count
  const junkFilteredCount = leads.filter((l) => isJunkOrSpamLead(l)).length;

  // F. Handoffs waiting (queue: stage = 'HANDOFF_TO_AGENT' OR ai_paused = true)
  const queueLeads = leads
    .filter((l) => isLeadInQueue(l))
    .sort((a, b) => {
      const timeA = new Date(a.handoff_at || a.last_lead_message_at || a.updated_at).getTime();
      const timeB = new Date(b.handoff_at || b.last_lead_message_at || b.updated_at).getTime();
      return timeA - timeB; // longest waiting first
    });

  // G. Group messages by lead_id to calculate median reply time, after-hours leads, and hours saved
  const leadMessagesMap = new Map<string, Message[]>();
  let totalAiReplies = 0;

  for (const m of messages) {
    if (!leadMessagesMap.has(m.lead_id)) {
      leadMessagesMap.set(m.lead_id, []);
    }
    leadMessagesMap.get(m.lead_id)!.push(m);
    if (m.direction === 'OUTGOING' && m.sender === 'AI') {
      totalAiReplies++;
    }
  }

  // Median first-reply time (7 days) & After-hours tracking:
  const replyDeltasInSeconds: number[] = [];
  const activeConversationLeads = new Set<string>();
  const afterHoursLeadsSet = new Set<string>();
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
            const inboundTime = new Date(
              current.received_at || current.created_at
            ).getTime();
            const outgoingTime = new Date(next.created_at).getTime();
            const diffSeconds = Math.max(0, (outgoingTime - inboundTime) / 1000);

            activeConversationLeads.add(leadId);

            // Check if received outside 09:00 - 19:00 Mon-Sat Dubai time
            if (isOutsideDubaiBusinessHours(current.received_at || current.created_at)) {
              afterHoursAnsweredCount++;
              afterHoursLeadsSet.add(leadId);
            }

            // Ignore gaps over 1 hour (3600s)
            if (diffSeconds >= 0 && diffSeconds <= 3600) {
              replyDeltasInSeconds.push(diffSeconds);
            }
            break; // found the next AI reply for this inbound message
          }
        }
      }
    }
  });

  // Also check lead creation timestamps for after-hours leads if messages were older than 7 days
  for (const l of leads) {
    if (isOutsideDubaiBusinessHours(l.created_at)) {
      afterHoursLeadsSet.add(l.id);
    }
  }

  // Calculate median first reply
  let medianFirstReplyString = 'n/a';
  if (replyDeltasInSeconds.length > 0) {
    replyDeltasInSeconds.sort((a, b) => a - b);
    const mid = Math.floor(replyDeltasInSeconds.length / 2);
    const medianSec =
      replyDeltasInSeconds.length % 2 !== 0
        ? replyDeltasInSeconds[mid]
        : (replyDeltasInSeconds[mid - 1] + replyDeltasInSeconds[mid]) / 2;

    if (medianSec < 60) {
      medianFirstReplyString = `${Math.max(1, Math.round(medianSec))} seconds`;
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
      : leadsThisWeek;

  // Hours saved: 4 minutes per AI message turn (fallback to 12 mins per answered lead if no recent messages)
  const minutesSaved =
    totalAiReplies > 0 ? totalAiReplies * 4 : Math.max(leads.length * 8, 0);
  const hoursSavedDisplay =
    minutesSaved >= 60
      ? `${(minutesSaved / 60).toFixed(1)} hrs`
      : `${minutesSaved} mins`;

  // Pipeline stage counts
  const stageCounts: Record<string, number> = {};
  for (const lead of leads) {
    const stage = lead.stage || 'NEW';
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Top Headline Banner & 6-Card ROI & Operational KPI Grid */}
      <OverviewKpiSection
        conversationsThisWeekCount={conversationsThisWeekCount}
        medianFirstReplyString={medianFirstReplyString}
        afterHoursAnsweredCount={afterHoursAnsweredCount}
        afterHoursLeadsCount={afterHoursLeadsSet.size}
        defaultBotPhone={defaultBotPhone}
        estimatedPipelineAed={estimatedPipelineAed}
        estimatedCommissionAed={estimatedCommissionAed}
        activePipelineLeadsCount={activePipelineLeads.length}
        qualifiedLeads={qualifiedLeads}
        viewingsBooked={viewingsBooked}
        upcomingBookingsCount={upcomingBookings.length}
        hoursSavedDisplay={hoursSavedDisplay}
        junkFilteredCount={junkFilteredCount}
        queueLeadsCount={queueLeads.length}
      />

      {/* Interactive Revenue, Commission & Pipeline Analytics Graphs */}
      <RevenueAnalyticsCharts
        leads={leads}
        bookings={allBookings}
        agents={agents}
      />

      {/* Pipeline Strip */}
      <PipelineStrip stageCounts={stageCounts} totalLeads={leads.length} />

      {/* Lead Source & Channel ROI Table */}
      <ChannelRoiSection leads={leads} bookings={allBookings} />

      {/* Two Column Grid: "Needs you" & "Upcoming viewings" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeedsYouSection pausedLeads={queueLeads} />
        <UpcomingViewingsSection viewings={upcomingBookings} />
      </div>
    </div>
  );
}

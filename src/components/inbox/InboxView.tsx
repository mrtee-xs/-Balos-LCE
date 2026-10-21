'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Lead,
  Agent,
  Message,
  LEAD_STAGE_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  isLeadInQueue,
  getQueueStatusBadge,
  getLeadSourceMeta,
  canAssignLeads,
} from '../../lib/types';
import { createClient } from '../../lib/supabase/client';
import { useDashboard } from '../layout/DashboardContext';
import { useRealtime } from '../layout/RealtimeProvider';
import {
  takeOverLead,
  handBackToAi,
  updateLeadStage,
  assignLeadAgent,
  updateLeadSource,
  updateLeadNotes,
} from '../../lib/actions/leads';
import { MessageInputBar } from './MessageInputBar';
import { formatDubaiTime, formatDuration } from '../../lib/date';
import { formatAED, resolveMediaUrl } from '../../lib/utils';
import {
  PauseCircle,
  PlayCircle,
  Bot,
  User,
  ArrowLeft,
  Info,
  MapPin,
  Bed,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
  Check,
  FileText,
  ExternalLink,
  Building2,
  Video,
  Image as ImageIcon,
  Send,
  Play,
  X,
  Eye,
  Share2,
} from 'lucide-react';
import { Property } from '../../lib/types';
import { PropertyInfoModal } from '../properties/PropertyInfoModal';
import { getPropertyPreview } from '../../lib/utils';
import { sendAgentWhatsAppMessage } from '../../lib/actions/messages';
import { syncLeadToCrmAction } from '../../lib/actions/crm';

interface InboxViewProps {
  initialLeads: Lead[];
  agents?: Agent[];
  initialSelectedLeadId?: string;
}

export function InboxView({
  initialLeads,
  agents = [],
  initialSelectedLeadId,
}: InboxViewProps) {
  const searchParams = useSearchParams();
  const queryLeadId = searchParams.get('lead');
  const { role, isAdmin } = useDashboard();
  const hasAssignPermission = canAssignLeads(role, isAdmin);

  const {
    setQueueCount,
    unreadLeadIds,
    markLeadRead,
    subscribeToMessages,
    subscribeToLeads,
    refetchTrigger,
  } = useRealtime();

  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    queryLeadId || initialSelectedLeadId || initialLeads[0]?.id || ''
  );
  const [showMobileDetail, setShowMobileDetail] = useState(Boolean(queryLeadId));
  const [showMobileDossier, setShowMobileDossier] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [notesSaved, setNotesSaved] = useState<boolean>(false);
  const [isCrmSyncing, setIsCrmSyncing] = useState(false);
  const [crmFeedback, setCrmFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Property suggestion states
  const [showDossierPropertyPicker, setShowDossierPropertyPicker] = useState(false);
  const [dossierProperties, setDossierProperties] = useState<Property[]>([]);
  const [loadingDossierProperties, setLoadingDossierProperties] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null);
  const [dossierPropertySearch, setDossierPropertySearch] = useState('');

  // In-memory cache for lead messages
  const messagesCache = useRef<Map<string, Message[]>>(new Map());
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Derive queue leads vs all leads
  const queueLeads = leads
    .filter((l) => isLeadInQueue(l))
    .sort((a, b) => {
      const timeA = new Date(
        a.handoff_at || a.last_lead_message_at || a.updated_at
      ).getTime();
      const timeB = new Date(
        b.handoff_at || b.last_lead_message_at || b.updated_at
      ).getTime();
      return timeA - timeB; // longest waiting first
    });

  const allLeads = [...leads].sort((a, b) => {
    const timeA = new Date(a.last_lead_message_at || a.updated_at).getTime();
    const timeB = new Date(b.last_lead_message_at || b.updated_at).getTime();
    return timeB - timeA; // most recent first
  });

  // Keep queueCount synced with RealtimeProvider and Sidebar badge
  useEffect(() => {
    setQueueCount(queueLeads.length);
  }, [queueLeads.length, setQueueCount]);

  // Periodic ticker to keep wait durations ("Waiting 4m", etc.) updated in real-time
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const displayedLeads = activeTab === 'queue' ? queueLeads : allLeads;
  const selectedLead =
    leads.find((l) => l.id === selectedLeadId) || displayedLeads[0];

  // Sync notesDraft when selectedLead changes
  useEffect(() => {
    if (!selectedLead) {
      setNotesDraft('');
      return;
    }
    if (selectedLead.notes) {
      setNotesDraft(selectedLead.notes);
    } else if (typeof window !== 'undefined') {
      const localNote = window.localStorage.getItem(
        `balos_lead_note_${selectedLead.id}`
      );
      setNotesDraft(localNote || '');
    } else {
      setNotesDraft('');
    }
    setNotesSaved(false);
  }, [selectedLead?.id, selectedLead?.notes]);

  // Helper to fetch messages from browser client
  const fetchMessagesForLead = useCallback(
    async (leadId: string, limit = 100) => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })
        .limit(limit);

      return (data as Message[]) || [];
    },
    [supabase]
  );

  // Background prefetch helper
  const prefetchLeadMessages = useCallback(
    async (leadId: string) => {
      if (messagesCache.current.has(leadId)) return;
      const msgs = await fetchMessagesForLead(leadId);
      messagesCache.current.set(leadId, msgs);
    },
    [fetchMessagesForLead]
  );

  // Prefetch top 5 queue leads on mount
  useEffect(() => {
    const topLeads = queueLeads.slice(0, 5);
    topLeads.forEach((l) => {
      prefetchLeadMessages(l.id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages for currently selected lead
  const loadMessages = useCallback(
    async (leadId: string) => {
      if (!leadId) {
        setMessages([]);
        return;
      }

      if (messagesCache.current.has(leadId)) {
        const cached = messagesCache.current.get(leadId)!;
        setMessages(cached);
        setHasMoreOlder(cached.length >= 100);
        return;
      }

      setLoadingMessages(true);
      const fetched = await fetchMessagesForLead(leadId);
      messagesCache.current.set(leadId, fetched);
      setMessages(fetched);
      setHasMoreOlder(fetched.length >= 100);
      setLoadingMessages(false);
    },
    [fetchMessagesForLead]
  );

  // When selected lead changes or reconnects
  useEffect(() => {
    if (selectedLead?.id) {
      loadMessages(selectedLead.id);
      markLeadRead(selectedLead.id);
    }
  }, [selectedLead?.id, loadMessages, markLeadRead, refetchTrigger]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Realtime subscription handlers
  useEffect(() => {
    const unsubMessages = subscribeToMessages((newMsg) => {
      if (selectedLeadId && newMsg.lead_id === selectedLeadId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          messagesCache.current.set(selectedLeadId, updated);
          return updated;
        });
      } else if (messagesCache.current.has(newMsg.lead_id)) {
        const cached = messagesCache.current.get(newMsg.lead_id)!;
        if (!cached.some((m) => m.id === newMsg.id)) {
          messagesCache.current.set(newMsg.lead_id, [...cached, newMsg]);
        }
      }

      setLeads((prev) => {
        const idx = prev.findIndex((l) => l.id === newMsg.lead_id);
        if (idx === -1) return prev;
        const updatedLead = {
          ...prev[idx],
          last_lead_message_at: newMsg.created_at,
          updated_at: newMsg.created_at,
        };
        const next = [...prev];
        next.splice(idx, 1);
        next.unshift(updatedLead);
        return next;
      });
    });

    const unsubLeads = subscribeToLeads((updatedLead) => {
      setLeads((prev) => {
        const idx = prev.findIndex((l) => l.id === updatedLead.id);
        if (idx === -1) {
          return [updatedLead, ...prev];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], ...updatedLead };
        return next;
      });
    });

    return () => {
      unsubMessages();
      unsubLeads();
    };
  }, [selectedLeadId, subscribeToMessages, subscribeToLeads]);

  // Instant lead selection handler
  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    setShowMobileDetail(true);
    setActionError(null);
    markLeadRead(id);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('lead', id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Load older messages handler
  const handleLoadOlder = async () => {
    if (!selectedLead || messages.length === 0 || loadingOlder) return;
    setLoadingOlder(true);
    const oldestTimestamp = messages[0].created_at;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', selectedLead.id)
      .lt('created_at', oldestTimestamp)
      .order('created_at', { ascending: true })
      .limit(50);

    const olderMsgs = (data as Message[]) || [];
    if (olderMsgs.length < 50) {
      setHasMoreOlder(false);
    }

    if (olderMsgs.length > 0) {
      const combined = [...olderMsgs, ...messages];
      setMessages(combined);
      messagesCache.current.set(selectedLead.id, combined);
    }
    setLoadingOlder(false);
  };

  // Optimistic Take Over
  const handleTakeOver = () => {
    if (!selectedLead) return;
    setActionError(null);

    const oldPaused = selectedLead.ai_paused;
    const oldHandoffAt = selectedLead.handoff_at;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id
          ? {
              ...l,
              ai_paused: true,
              handoff_at: l.handoff_at || new Date().toISOString(),
            }
          : l
      )
    );

    startTransition(async () => {
      const res = await takeOverLead(selectedLead.id);
      if (!res.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id
              ? { ...l, ai_paused: oldPaused, handoff_at: oldHandoffAt }
              : l
          )
        );
        setActionError(res.error || 'Failed to take over lead.');
      }
    });
  };

  // Optimistic Hand Back to AI
  const handleHandBack = () => {
    if (!selectedLead) return;
    setActionError(null);

    const oldPaused = selectedLead.ai_paused;
    const oldStage = selectedLead.stage;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id
          ? {
              ...l,
              ai_paused: false,
              stage: l.stage === 'HANDOFF_TO_AGENT' ? 'ENGAGED' : l.stage,
            }
          : l
      )
    );

    startTransition(async () => {
      const res = await handBackToAi(selectedLead.id, oldStage);
      if (!res.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id
              ? { ...l, ai_paused: oldPaused, stage: oldStage }
              : l
          )
        );
        setActionError(res.error || 'Failed to hand back to AI.');
      }
    });
  };

  // In-app Stage Update
  const handleStageUpdate = (newStage: string) => {
    if (!selectedLead) return;
    setActionError(null);
    const oldStage = selectedLead.stage;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id ? { ...l, stage: newStage } : l
      )
    );

    startTransition(async () => {
      const res = await updateLeadStage(selectedLead.id, newStage);
      if (!res.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, stage: oldStage } : l
          )
        );
        setActionError(res.error || 'Failed to update stage.');
      }
    });
  };

  // In-app Agent Assignment
  const handleAgentUpdate = (newAgentId: string) => {
    if (!selectedLead) return;
    setActionError(null);
    const val = newAgentId || null;
    const oldAgent = selectedLead.assigned_agent_id;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id ? { ...l, assigned_agent_id: val } : l
      )
    );

    startTransition(async () => {
      const res = await assignLeadAgent(selectedLead.id, val);
      if (!res.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id
              ? { ...l, assigned_agent_id: oldAgent }
              : l
          )
        );
        setActionError(res.error || 'Failed to assign agent.');
      }
    });
  };

  // In-app Lead Source Update
  const handleSourceUpdate = (newSource: string) => {
    if (!selectedLead) return;
    setActionError(null);
    const oldSource = selectedLead.source;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id ? { ...l, source: newSource } : l
      )
    );

    startTransition(async () => {
      const res = await updateLeadSource(selectedLead.id, newSource);
      if (!res.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, source: oldSource } : l
          )
        );
        setActionError(res.error || 'Failed to update lead source.');
      }
    });
  };

  // In-app Consultant Notes Save
  const handleSaveNotes = () => {
    if (!selectedLead) return;
    setActionError(null);
    setNotesSaved(false);

    // Always persist in localStorage as instant backup
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        `balos_lead_note_${selectedLead.id}`,
        notesDraft
      );
    }

    setLeads((prev) =>
      prev.map((l) =>
        l.id === selectedLead.id ? { ...l, notes: notesDraft } : l
      )
    );

    startTransition(async () => {
      const res = await updateLeadNotes(selectedLead.id, notesDraft);
      if (res.success) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2500);
      } else {
        // Still saved locally if DB migration hasn't run yet
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2500);
      }
    });
  };

  // Push lead immediately to external CRM
  const handlePushToCrm = async () => {
    if (!selectedLead) return;
    setIsCrmSyncing(true);
    setCrmFeedback(null);

    try {
      const res = await syncLeadToCrmAction(selectedLead.id);
      if (res.summary && res.summary.triggeredCount > 0) {
        const successes = res.summary.results
          .filter((r) => r.success)
          .map((r) => r.name);
        const failures = res.summary.results
          .filter((r) => !r.success)
          .map((r) => `${r.name} (${r.errorMessage})`);

        if (successes.length > 0) {
          setCrmFeedback({
            type: 'success',
            message: `Synced to ${successes.join(', ')}!`,
          });
          setTimeout(() => setCrmFeedback(null), 5000);
        }
        if (failures.length > 0) {
          setCrmFeedback({
            type: 'error',
            message: `Warning: ${failures.join('; ')}`,
          });
        }
      } else if (res.summary && res.summary.triggeredCount === 0) {
        setCrmFeedback({
          type: 'error',
          message:
            'No active CRM configured. Go to Administration > CRM Integrations to enable Follow Up Boss or HubSpot.',
        });
      } else {
        setCrmFeedback({
          type: 'error',
          message: res.error || 'Failed to sync to CRM.',
        });
      }
    } catch (err: any) {
      setCrmFeedback({
        type: 'error',
        message: err.message || 'Error connecting to CRM dispatcher.',
      });
    } finally {
      setIsCrmSyncing(false);
    }
  };

  const handleSendPropertyFromDossier = async (property: Property) => {
    if (!selectedLead) return;
    const preview = getPropertyPreview(property);
    const mediaSource = property.video_url || preview.url || null;
    const mediaType: 'IMAGE' | 'VIDEO' = property.video_url || preview.isVideo ? 'VIDEO' : 'IMAGE';

    const formattedPrice = formatAED(property.price_aed);
    const goldenVisaTag = property.golden_visa_eligible
      ? '✨ *UAE Golden Visa:* Eligible for 10-Year Residency (AED 2.0M+)\n'
      : '';
    const permitTag = property.trakheesi_permit_no
      ? `📜 *DLD Trakheesi Permit:* #${property.trakheesi_permit_no}\n`
      : '';
    const handoverTag = property.handover_date
      ? `🏗️ *Handover:* ${property.handover_date}\n`
      : '';
    const roiTag = property.projected_roi
      ? `📈 *Projected ROI:* ${property.projected_roi}%\n`
      : '';
    const brochureTag = property.brochure_url
      ? `📄 *Brochure:* ${resolveMediaUrl(property.brochure_url)}\n`
      : '';
    const videoTag = property.video_url
      ? `🎥 *Video Tour:* ${resolveMediaUrl(property.video_url)}\n`
      : '';

    let paymentPlanText = '';
    if (typeof property.payment_plan === 'object' && property.payment_plan !== null) {
      paymentPlanText = `💳 *Payment Plan:* ${Object.entries(property.payment_plan)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}%`)
        .join(' | ')}\n`;
    } else if (property.market_type === 'OFF_PLAN') {
      paymentPlanText = `💳 *Payment Plan:* 20% Down Payment | 40% Construction | 40% Handover\n`;
    }

    const messageText = `🏡 *${property.title}*
📍 *Location:* ${property.community}${property.developer ? ` • by ${property.developer}` : ''}
💰 *Price:* ${formattedPrice}
📐 *Layout:* ${property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Beds`} | ${property.bathrooms ? `${property.bathrooms} Baths` : 'Luxury layout'} | ${property.size_sqft ? `${Number(property.size_sqft).toLocaleString()} sq ft` : 'Spacious'}
🏷️ *Market:* ${property.market_type === 'OFF_PLAN' ? 'Off-Plan' : 'Ready Secondary'}
${handoverTag}${paymentPlanText}${roiTag}${goldenVisaTag}${permitTag}${brochureTag}${videoTag}
Would you like me to reserve a private walkthrough or send the detailed floor plans?`.trim();

    const res = await sendAgentWhatsAppMessage({
      leadId: selectedLead.id,
      text: messageText,
      agentId: selectedLead.assigned_agent_id || null,
      agentName: agents.find((a) => a.id === selectedLead.assigned_agent_id)?.name || 'Agent',
      mediaUrl: mediaSource ? resolveMediaUrl(mediaSource) : null,
      mediaType,
      fileName: `${property.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_showcase`,
      propertyId: property.id,
    });

    if (res.success) {
      setShowDossierPropertyPicker(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'temp-' + Date.now(),
          lead_id: selectedLead.id,
          sender: 'HUMAN_AGENT',
          direction: 'OUTGOING',
          content: messageText,
          media_url: mediaSource ? resolveMediaUrl(mediaSource) : null,
          created_at: new Date().toISOString(),
        },
      ]);
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 80);
    }
  };

  const statusBadge = selectedLead ? getQueueStatusBadge(selectedLead) : null;
  const selectedSourceMeta = selectedLead
    ? getLeadSourceMeta(selectedLead.source)
    : null;

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-7.5rem)] overflow-hidden">
      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Leads List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col shrink-0 bg-surface ${
            showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Tabs header */}
          <div className="p-3 border-b border-border bg-surface-subtle">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-seaglass rounded-xl border border-border/60">
              <button
                onClick={() => setActiveTab('queue')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'queue'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>Handoffs queue</span>
                {queueLeads.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-coral text-white animate-pulse">
                    {queueLeads.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>All conversations</span>
                <span className="text-[10px] text-ink-faint">
                  ({allLeads.length})
                </span>
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {displayedLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                {activeTab === 'queue'
                  ? 'No handoffs waiting for agent attention.'
                  : 'No conversations recorded yet.'}
              </div>
            ) : (
              displayedLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const hasUnread = unreadLeadIds.has(lead.id);
                const badge = getQueueStatusBadge(lead);
                const sourceMeta = getLeadSourceMeta(lead.source);
                const waitTime = formatDuration(
                  lead.handoff_at || lead.last_lead_message_at || lead.updated_at
                );

                return (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    onMouseEnter={() => prefetchLeadMessages(lead.id)}
                    onTouchStart={() => prefetchLeadMessages(lead.id)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between gap-3 text-left relative ${
                      isSelected
                        ? 'bg-creek-subtle/80 border-l-4 border-l-creek'
                        : 'hover:bg-seaglass/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {hasUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-creek shrink-0"
                            title="New unread message"
                          />
                        )}
                        <span className="font-semibold text-xs text-ink truncate">
                          {lead.full_name && lead.full_name !== '.'
                            ? lead.full_name
                            : 'Direct WhatsApp Lead'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[11px] text-ink-muted truncate">
                          {lead.e164_phone || lead.whatsapp_id}
                        </p>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold shrink-0 ${sourceMeta.badgeClass}`}
                        >
                          {sourceMeta.shortLabel}
                        </span>
                      </div>

                      {/* Queue soft handoff status badge */}
                      {badge && (
                        <div className="mb-1">
                          <span
                            className={`inline-block text-[9.5px] font-semibold px-2 py-0.5 rounded-full ${
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
                        <p className="text-[10px] text-ink-muted line-clamp-1 italic bg-surface-subtle px-1.5 py-0.5 rounded">
                          &ldquo;{lead.handoff_reason}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-ink-muted block font-medium">
                        {isLeadInQueue(lead)
                          ? waitTime
                          : formatDubaiTime(
                              lead.last_lead_message_at || lead.updated_at
                            )}
                      </span>
                      <span className="mt-1 inline-block text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-seaglass text-ink-muted">
                        {lead.stage}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread & Dossier */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-seaglass/20 ${
            !showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedLead ? (
            <>
              {/* Thread Header */}
              <div className="h-16 px-4 md:px-6 border-b border-border bg-surface flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="md:hidden p-1.5 -ml-1 text-ink-muted hover:text-ink rounded-lg hover:bg-seaglass"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold font-heading text-ink truncate">
                        {selectedLead.full_name && selectedLead.full_name !== '.'
                          ? selectedLead.full_name
                          : 'Direct WhatsApp Lead'}
                      </h2>

                      {selectedSourceMeta && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selectedSourceMeta.badgeClass}`}
                        >
                          {selectedSourceMeta.shortLabel}
                        </span>
                      )}

                      {/* Header soft handoff status badge */}
                      {statusBadge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            statusBadge.variant === 'paused'
                              ? 'bg-coral-light text-coral'
                              : 'bg-saffron-light text-saffron-hover'
                          }`}
                        >
                          {statusBadge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted truncate">
                      {selectedLead.e164_phone || selectedLead.whatsapp_id} • Stage:{' '}
                      {selectedLead.stage}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMobileDossier((v) => !v)}
                    className="lg:hidden px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-ink hover:bg-seaglass transition"
                  >
                    Dossier
                  </button>

                  {!selectedLead.ai_paused && (
                    <button
                      onClick={handleTakeOver}
                      disabled={isPending}
                      title="Pause the AI and handle this conversation directly"
                      className="px-3.5 py-1.5 rounded-lg bg-coral hover:bg-coral-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
                    >
                      <PauseCircle className="w-4 h-4" />
                      <span>Take over</span>
                    </button>
                  )}

                  {(selectedLead.ai_paused ||
                    selectedLead.stage === 'HANDOFF_TO_AGENT') && (
                    <button
                      onClick={handleHandBack}
                      disabled={isPending}
                      title="Resolves this handoff and lets the AI reply normally."
                      className="px-3.5 py-1.5 rounded-lg bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Hand back to AI</span>
                    </button>
                  )}
                </div>
              </div>

              {actionError && (
                <div className="px-4 py-2 bg-coral-light border-b border-coral/30 text-coral text-xs">
                  {actionError}
                </div>
              )}

              {/* Main Middle Area: Thread + Right Lead Intelligence Panel */}
              <div className="flex-1 flex min-h-0 relative">
                {/* Message stream */}
                <div className="flex-1 flex flex-col min-h-0 bg-surface/50">
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
                  >
                    {hasMoreOlder && (
                      <div className="text-center pt-1 pb-2">
                        <button
                          onClick={handleLoadOlder}
                          disabled={loadingOlder}
                          className="px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-medium text-ink-muted hover:text-ink hover:bg-seaglass transition inline-flex items-center gap-1"
                        >
                          {loadingOlder ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading older messages...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Load older messages
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {loadingMessages && messages.length === 0 ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="flex flex-col items-start space-y-1">
                          <div className="h-3 w-16 bg-border/40 rounded" />
                          <div className="h-10 w-64 bg-seaglass rounded-2xl" />
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <div className="h-3 w-20 bg-border/40 rounded" />
                          <div className="h-14 w-72 bg-creek-light/40 rounded-2xl" />
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                        No messages in this conversation yet.
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isLead = msg.sender === 'LEAD';
                        const isAI = msg.sender === 'AI';
                        const isAgent = msg.sender === 'HUMAN_AGENT';
                        const mediaUrl = msg.media_url
                          ? resolveMediaUrl(msg.media_url)
                          : null;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isLead ? 'items-start' : 'items-end'
                            }`}
                          >
                            <div className="flex items-center gap-1 text-[10px] text-ink-faint mb-1 px-1">
                              {isAI && (
                                <span className="inline-flex items-center gap-0.5 text-creek font-medium">
                                  <Bot className="w-3 h-3" /> Balos AI
                                </span>
                              )}
                              {isAgent && (
                                <span className="inline-flex items-center gap-0.5 text-creek font-medium">
                                  <User className="w-3 h-3" /> Licensed Broker
                                </span>
                              )}
                              {isLead && (
                                <span className="text-ink-muted font-medium">
                                  {selectedLead.full_name || 'Lead'}
                                </span>
                              )}
                              <span>•</span>
                              <span>{formatDubaiTime(msg.created_at)}</span>
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap space-y-2.5 ${
                                isAI
                                  ? 'bg-creek-light/70 text-ink border border-creek/20 rounded-tr-xs'
                                  : isAgent
                                  ? 'bg-ink text-white border border-ink shadow-sm rounded-tr-xs'
                                  : 'bg-seaglass text-ink border border-border/70 rounded-tl-xs'
                              }`}
                            >
                              {/* Media / Attachment Rendering */}
                              {mediaUrl && (() => {
                                const isImg =
                                  msg.message_type === 'IMAGE' ||
                                  /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(mediaUrl) ||
                                  mediaUrl.includes('/images/');
                                const isVid =
                                  msg.message_type === 'VIDEO' ||
                                  /\.(mp4|mov|webm|m4v)($|\?)/i.test(mediaUrl) ||
                                  mediaUrl.includes('/videos/');

                                if (isImg) {
                                  return (
                                    <div className="rounded-xl overflow-hidden border border-border/40 mt-0.5 bg-black/10">
                                      <img
                                        src={mediaUrl}
                                        alt="Attached media"
                                        loading="lazy"
                                        className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95 transition"
                                        onClick={() => window.open(mediaUrl, '_blank')}
                                      />
                                    </div>
                                  );
                                }

                                if (isVid) {
                                  return (
                                    <div className="rounded-xl overflow-hidden border border-border/40 mt-0.5 max-h-72 bg-black">
                                      <video
                                        src={mediaUrl}
                                        controls
                                        playsInline
                                        className="w-full max-h-72 object-contain"
                                      />
                                    </div>
                                  );
                                }

                                return (
                                  <div className="p-2.5 rounded-xl bg-surface/90 border border-border/60 flex items-center justify-between gap-2.5 mt-0.5 text-ink shadow-2xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="p-1.5 rounded-lg bg-creek-light text-creek shrink-0">
                                        <FileText className="w-4 h-4" />
                                      </div>
                                      <span className="text-[11px] font-semibold truncate">
                                        {mediaUrl.split('/').pop() || 'Attached Document'}
                                      </span>
                                    </div>
                                    <a
                                      href={mediaUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-creek text-white text-[10px] font-bold shrink-0 flex items-center gap-1 hover:bg-creek-hover transition"
                                    >
                                      <span>Open</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                );
                              })()}

                              {msg.content && <div className="leading-relaxed">{msg.content}</div>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Native In-Dashboard WhatsApp Reply Bar & AI Co-Pilot */}
                  <MessageInputBar
                    lead={selectedLead}
                    currentAgent={
                      agents.find((a) => a.id === selectedLead.assigned_agent_id) ||
                      agents[0] ||
                      null
                    }
                    onMessageSent={(newText) => {
                      const tempMsg: Message = {
                        id: 'temp-' + Date.now(),
                        lead_id: selectedLead.id,
                        sender: 'HUMAN_AGENT',
                        direction: 'OUTGOING',
                        content: newText,
                        created_at: new Date().toISOString(),
                      };
                      setMessages((prev) => [...prev, tempMsg]);
                      setTimeout(() => {
                        if (messagesContainerRef.current) {
                          messagesContainerRef.current.scrollTop =
                            messagesContainerRef.current.scrollHeight;
                        }
                      }, 60);
                    }}
                  />
                </div>

                {/* Right Lead Dossier & CRM Controls Panel */}
                <div
                  className={`${
                    showMobileDossier
                      ? 'flex absolute inset-y-0 right-0 z-20 w-80 shadow-xl'
                      : 'hidden lg:flex w-80'
                  } border-l border-border bg-surface p-4 flex-col overflow-y-auto space-y-4 shrink-0 text-xs`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold font-heading text-ink">
                      Lead dossier & actions
                    </h3>
                    {showMobileDossier && (
                      <button
                        type="button"
                        onClick={() => setShowMobileDossier(false)}
                        className="lg:hidden text-[11px] text-ink-muted hover:text-ink"
                      >
                        Close
                      </button>
                    )}
                  </div>

                  {/* In-App CRM Controls: Stage, Assigned Agent, Lead Source */}
                  <div className="p-3 bg-surface-subtle rounded-xl border border-border space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted mb-1">
                        Pipeline stage
                      </label>
                      <select
                        value={selectedLead.stage || 'NEW'}
                        disabled={isPending}
                        onChange={(e) => handleStageUpdate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-pure text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                      >
                        {LEAD_STAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium text-ink-muted">
                          Assigned agent
                        </label>
                        {!hasAssignPermission && (
                          <span className="text-[10px] text-ink-soft inline-flex items-center gap-0.5">
                            Leadership only
                          </span>
                        )}
                      </div>
                      {hasAssignPermission ? (
                        <>
                          <select
                            value={selectedLead.assigned_agent_id || ''}
                            disabled={isPending}
                            onChange={(e) => handleAgentUpdate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                          >
                            <option value="">Unassigned (AI handling)</option>
                            {agents.map((ag) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-ink-soft mt-1">
                            Syncs to Supabase & pushes live alert to agent
                          </p>
                        </>
                      ) : (
                        <div
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border/70 bg-seaglass/60 text-xs text-ink-muted flex items-center justify-between"
                          title="Only Admin, Sales Leader, or Team Leader can assign agents"
                        >
                          <span className="truncate font-medium text-ink">
                            {agents.find(
                              (ag) => ag.id === selectedLead.assigned_agent_id
                            )?.name || 'Unassigned (AI handling)'}
                          </span>
                          <span className="text-[10px] text-ink-soft shrink-0 ml-2">
                            Locked
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted mb-1">
                        Lead source channel
                      </label>
                      <select
                        value={(
                          selectedLead.source || 'DIRECT_WHATSAPP'
                        ).toUpperCase()}
                        disabled={isPending}
                        onChange={(e) => handleSourceUpdate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                      >
                        {LEAD_SOURCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* External CRM Sync Button */}
                    <div className="pt-1.5 border-t border-border/70">
                      <button
                        type="button"
                        disabled={isCrmSyncing}
                        onClick={handlePushToCrm}
                        className="w-full py-2 px-3 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                        title="Push lead profile & conversation to configured external CRMs"
                      >
                        <Share2
                          className={`w-3.5 h-3.5 text-emerald-600 ${
                            isCrmSyncing ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {isCrmSyncing ? 'Syncing to CRM...' : 'Push to External CRM'}
                        </span>
                      </button>
                      {crmFeedback && (
                        <p
                          className={`text-[10px] mt-1 text-center font-medium leading-tight ${
                            crmFeedback.type === 'success'
                              ? 'text-emerald-700'
                              : 'text-coral'
                          }`}
                        >
                          {crmFeedback.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score, Temp & Budget Summary */}
                  <div className="p-3 bg-surface-subtle rounded-xl border border-border space-y-2">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Score</span>
                      <span className="font-bold text-creek">
                        {selectedLead.lead_score ?? '—'}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Temperature</span>
                      <span className="font-semibold text-ink">
                        {selectedLead.temperature || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-ink-muted shrink-0">Budget</span>
                      <span className="font-semibold text-ink text-right">
                        {selectedLead.budget_aed_min ||
                        selectedLead.budget_aed_max
                          ? `${formatAED(selectedLead.budget_aed_min)} - ${formatAED(
                              selectedLead.budget_aed_max
                            )}`
                          : 'Flexible'}
                      </span>
                    </div>
                  </div>

                  {selectedLead.target_communities &&
                    selectedLead.target_communities.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold text-ink mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-creek" />
                          Target communities
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLead.target_communities.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-md bg-seaglass text-[11px] text-ink font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div>
                    <h4 className="text-[11px] font-semibold text-ink mb-1.5 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-creek" />
                      Preferences
                    </h4>
                    <div className="space-y-1 text-ink-muted">
                      <p>
                        Bedrooms:{' '}
                        <span className="text-ink font-medium">
                          {selectedLead.min_bedrooms ?? 'Any'} -{' '}
                          {selectedLead.max_bedrooms ?? 'Any'}
                        </span>
                      </p>
                      <p>
                        Category:{' '}
                        <span className="text-ink font-medium">
                          {selectedLead.target_category || 'Any'}
                        </span>
                      </p>
                      <p>
                        Timeline:{' '}
                        <span className="text-ink font-medium">
                          {selectedLead.timeline || 'Immediate'}
                        </span>
                      </p>
                      {selectedLead.golden_visa_seeker && (
                        <p className="text-creek font-semibold">
                          ✓ Seeking 10-Year UAE Golden Visa
                        </p>
                      )}
                    </div>

                    {/* Direct Property Suggestion Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDossierPropertyPicker(true);
                          if (dossierProperties.length === 0) {
                            setLoadingDossierProperties(true);
                            supabase
                              .from('properties')
                              .select('*')
                              .eq('status', 'AVAILABLE')
                              .order('created_at', { ascending: false })
                              .then(({ data }) => {
                                if (data) setDossierProperties(data as Property[]);
                                setLoadingDossierProperties(false);
                              });
                          }
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-creek hover:bg-creek-hover text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                      >
                        <Building2 className="w-3.5 h-3.5 text-white" />
                        <span>Suggest Property to Lead</span>
                      </button>
                    </div>
                  </div>

                  {selectedLead.handoff_reason && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-coral mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Handoff reason
                      </h4>
                      <p className="p-2.5 rounded-lg bg-coral-light text-coral text-[11px] leading-relaxed">
                        {selectedLead.handoff_reason}
                      </p>
                    </div>
                  )}

                  {/* Consultant Notes Section */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold text-ink flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-creek" />
                        Agent notes
                      </h4>
                      {notesSaved && (
                        <span className="text-[10px] font-semibold text-creek inline-flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Saved
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Add call notes, mortgage status, or viewing preferences..."
                      className="w-full p-2.5 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isPending}
                      className="w-full py-1.5 px-3 rounded-lg bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save notes</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-ink-muted">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>

      {/* Property Information Modal */}
      <PropertyInfoModal
        property={selectedPropertyForModal}
        isOpen={Boolean(selectedPropertyForModal)}
        onClose={() => setSelectedPropertyForModal(null)}
        onSuggestToLead={selectedLead ? handleSendPropertyFromDossier : undefined}
      />

      {/* Dossier Property Suggestion Picker Modal */}
      {showDossierPropertyPicker && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-subtle flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-ink font-heading">
                  Suggest Property to {selectedLead.full_name || 'Lead'}
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Sending directly attaches photo/video tour, pricing, and all UAE regulatory details into WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDossierPropertyPicker(false)}
                className="p-1.5 text-ink-muted hover:text-ink hover:bg-seaglass rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-border/60 bg-surface shrink-0">
              <input
                type="text"
                value={dossierPropertySearch}
                onChange={(e) => setDossierPropertySearch(e.target.value)}
                placeholder="Filter by community, title, or developer..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-surface-subtle focus:outline-none focus:border-creek"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loadingDossierProperties ? (
                <div className="p-8 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-creek" />
                  <span>Loading property inventory...</span>
                </div>
              ) : dossierProperties.filter((p) => {
                  if (!dossierPropertySearch.trim()) return true;
                  const q = dossierPropertySearch.toLowerCase();
                  return (
                    p.title.toLowerCase().includes(q) ||
                    p.community.toLowerCase().includes(q) ||
                    (p.developer && p.developer.toLowerCase().includes(q))
                  );
                }).length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted">
                  No properties found matching your search.
                </div>
              ) : (
                dossierProperties
                  .filter((p) => {
                    if (!dossierPropertySearch.trim()) return true;
                    const q = dossierPropertySearch.toLowerCase();
                    return (
                      p.title.toLowerCase().includes(q) ||
                      p.community.toLowerCase().includes(q) ||
                      (p.developer && p.developer.toLowerCase().includes(q))
                    );
                  })
                  .map((prop) => {
                    const prev = getPropertyPreview(prop);
                    return (
                      <div
                        key={prop.id}
                        className="p-3 bg-surface hover:bg-surface-subtle rounded-xl border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prev.url}
                            alt={prop.title}
                            className="w-14 h-14 rounded-lg object-cover bg-seaglass shrink-0 border border-border"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-ink truncate">
                              {prop.title}
                            </h4>
                            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-creek">{formatAED(prop.price_aed)}</span>
                              <span>•</span>
                              <span>{prop.community}</span>
                              <span>•</span>
                              <span>{prop.bedrooms === 0 ? 'Studio' : `${prop.bedrooms} Beds`}</span>
                            </div>
                            {prop.golden_visa_eligible && (
                              <span className="text-[10px] text-creek font-bold inline-block mt-0.5">
                                ✓ 10-Yr Golden Visa Eligible
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedPropertyForModal(prop)}
                            className="py-1.5 px-2.5 rounded-lg border border-border hover:bg-seaglass text-ink text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Info className="w-3.5 h-3.5 text-creek" />
                            <span>Property Info</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendPropertyFromDossier(prop)}
                            className="py-1.5 px-3 rounded-lg bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send to WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

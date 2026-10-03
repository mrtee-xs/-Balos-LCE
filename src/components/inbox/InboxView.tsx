'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lead, Message, isLeadInQueue, getQueueStatusBadge } from '../../lib/types';
import { createClient } from '../../lib/supabase/client';
import { useRealtime } from '../layout/RealtimeProvider';
import { takeOverLead, handBackToAi } from '../../lib/actions/leads';
import { formatDubaiTime, formatDuration } from '../../lib/date';
import { formatAED } from '../../lib/utils';
import {
  PauseCircle,
  PlayCircle,
  Bot,
  User,
  ArrowLeft,
  Info,
  Clock,
  MapPin,
  Bed,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface InboxViewProps {
  initialLeads: Lead[];
  initialSelectedLeadId?: string;
}

export function InboxView({
  initialLeads,
  initialSelectedLeadId,
}: InboxViewProps) {
  const searchParams = useSearchParams();
  const queryLeadId = searchParams.get('lead');

  const {
    queueCount,
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // In-memory cache for lead messages
  const messagesCache = useRef<Map<string, Message[]>>(new Map());
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Derive queue leads vs all leads
  const queueLeads = leads
    .filter((l) => isLeadInQueue(l))
    .sort((a, b) => {
      const timeA = new Date(a.handoff_at || a.last_lead_message_at || a.updated_at).getTime();
      const timeB = new Date(b.handoff_at || b.last_lead_message_at || b.updated_at).getTime();
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
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || displayedLeads[0];

  // Helper to fetch messages from browser client
  const fetchMessagesForLead = useCallback(
    async (leadId: string, limit = 100) => {
      const { data } = await supabase
        .from('messages')
        .select('id, lead_id, direction, sender, content, created_at')
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

      // If cached, display instantly (0 ms)
      if (messagesCache.current.has(leadId)) {
        const cached = messagesCache.current.get(leadId)!;
        setMessages(cached);
        setHasMoreOlder(cached.length >= 100);
        return;
      }

      // Otherwise show skeleton and fetch
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
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Realtime subscription handlers
  useEffect(() => {
    const unsubMessages = subscribeToMessages((newMsg) => {
      // 1. If message belongs to active thread, append it
      if (selectedLeadId && newMsg.lead_id === selectedLeadId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          messagesCache.current.set(selectedLeadId, updated);
          return updated;
        });
      } else if (messagesCache.current.has(newMsg.lead_id)) {
        // Update cached messages for that lead
        const cached = messagesCache.current.get(newMsg.lead_id)!;
        if (!cached.some((m) => m.id === newMsg.id)) {
          messagesCache.current.set(newMsg.lead_id, [...cached, newMsg]);
        }
      }

      // 2. Update lead's last message timestamp and bump to top
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

    // Update URL immediately without Next.js server round trip
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
      .select('id, lead_id, direction, sender, content, created_at')
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

    // Optimistic UI update
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
        // Rollback
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

    // Optimistic UI update
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
        // Rollback
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

  const statusBadge = selectedLead ? getQueueStatusBadge(selectedLead) : null;

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
                const waitTime = formatDuration(lead.handoff_at || lead.last_lead_message_at || lead.updated_at);

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

                      <p className="text-[11px] text-ink-muted truncate mb-1">
                        {lead.e164_phone || lead.whatsapp_id}
                      </p>

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
                          "{lead.handoff_reason}"
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-ink-muted block font-medium">
                        {isLeadInQueue(lead)
                          ? waitTime
                          : formatDubaiTime(lead.last_lead_message_at || lead.updated_at)}
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
                      {selectedLead.e164_phone || selectedLead.whatsapp_id} • Stage: {selectedLead.stage}
                    </p>
                  </div>
                </div>

                {/* Take over / Hand back action buttons with helper texts */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Take over button (shown when ai_paused = false) */}
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

                  {/* Hand back to AI button (shown when ai_paused = true OR stage is handoff) */}
                  {(selectedLead.ai_paused || selectedLead.stage === 'HANDOFF_TO_AGENT') && (
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
              <div className="flex-1 flex min-h-0">
                {/* Message stream */}
                <div className="flex-1 flex flex-col min-h-0 bg-surface/50">
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
                  >
                    {/* Load older messages button */}
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

                    {/* Skeletons when initial fetch is running */}
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
                        <div className="flex flex-col items-start space-y-1">
                          <div className="h-3 w-16 bg-border/40 rounded" />
                          <div className="h-8 w-48 bg-seaglass rounded-2xl" />
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
                                <span className="inline-flex items-center gap-0.5 text-ink-muted font-medium">
                                  <User className="w-3 h-3" /> Human agent
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
                              className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                                isAI
                                  ? 'bg-creek-light/70 text-ink border border-creek/20 rounded-tr-xs'
                                  : isAgent
                                  ? 'bg-surface-pure text-ink border border-border shadow-xs rounded-tr-xs'
                                  : 'bg-seaglass text-ink border border-border/70 rounded-tl-xs'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* V1 WhatsApp Reply Notice (No reply box in v1) */}
                  <div className="p-3.5 bg-surface border-t border-border flex items-center justify-between text-xs text-ink-muted">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-creek shrink-0" />
                      <span>Reply to this lead from your WhatsApp.</span>
                    </div>
                    {selectedLead.e164_phone && (
                      <a
                        href={`https://wa.me/${selectedLead.e164_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-creek hover:underline shrink-0"
                      >
                        Open WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Lead Details Panel (Desktop) */}
                <div className="hidden lg:flex w-72 border-l border-border bg-surface p-4 flex-col overflow-y-auto space-y-4 shrink-0 text-xs">
                  <div>
                    <h3 className="text-xs font-bold font-heading text-ink mb-2">
                      Lead dossier
                    </h3>
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
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Budget</span>
                        <span className="font-semibold text-ink">
                          {selectedLead.budget_aed_min || selectedLead.budget_aed_max
                            ? `${formatAED(selectedLead.budget_aed_min)} - ${formatAED(selectedLead.budget_aed_max)}`
                            : 'Flexible'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedLead.target_communities && selectedLead.target_communities.length > 0 && (
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
                          {selectedLead.min_bedrooms ?? 'Any'} - {selectedLead.max_bedrooms ?? 'Any'}
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
    </div>
  );
}

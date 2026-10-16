'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { useDashboard } from './DashboardContext';
import {
  Lead,
  Message,
  Booking,
  AgentNotification,
  canAssignLeads,
} from '../../lib/types';
import { BellRing, X, ArrowRight, UserCheck, MessageSquare } from 'lucide-react';

type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

interface RealtimeContextType {
  connectionStatus: ConnectionStatus;
  queueCount: number;
  setQueueCount: React.Dispatch<React.SetStateAction<number>>;
  unreadLeadIds: Set<string>;
  markLeadRead: (leadId: string) => void;
  subscribeToMessages: (callback: (msg: Message) => void) => () => void;
  subscribeToLeads: (callback: (lead: Lead) => void) => () => void;
  subscribeToBookings: (callback: (booking: Booking) => void) => () => void;
  refetchTrigger: number;
  notifications: AgentNotification[];
  unreadNotificationCount: number;
  markAllNotificationsRead: () => void;
  triggerDemoAssignmentNotification: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

function playSubtleChime() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14); // A5
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore audio context errors when autoplay is blocked
  }
}

export function RealtimeProvider({
  children,
  initialQueueCount = 0,
}: {
  children: React.ReactNode;
  initialQueueCount?: number;
}) {
  const { agentId, name, role, isAdmin } = useDashboard();
  const isLeader = canAssignLeads(role, isAdmin);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('CONNECTING');
  const [queueCount, setQueueCount] = useState<number>(initialQueueCount);
  const [unreadLeadIds, setUnreadLeadIds] = useState<Set<string>>(new Set());
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AgentNotification | null>(null);

  const messageListeners = useRef<Set<(msg: Message) => void>>(new Set());
  const leadListeners = useRef<Set<(lead: Lead) => void>>(new Set());
  const bookingListeners = useRef<Set<(booking: Booking) => void>>(new Set());
  const lastKnownAssignedMap = useRef<Map<string, string | null>>(new Map());

  const pushNotification = useCallback(
    (notif: Omit<AgentNotification, 'id' | 'createdAt' | 'read'>) => {
      const fullNotif: AgentNotification = {
        ...notif,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [fullNotif, ...prev.slice(0, 29)]);
      setActiveToast(fullNotif);
      playSubtleChime();

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(fullNotif.title, {
            body: fullNotif.body,
          });
        } catch {
          // Ignore desktop notification errors
        }
      }
    },
    []
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const triggerDemoAssignmentNotification = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }
    pushNotification({
      type: 'LEAD_ASSIGNED',
      title: `Lead assigned to ${name || 'you'}`,
      body: 'Palm Jumeirah Villa Buyer (AED 18.5M) — synced via Supabase Realtime.',
      leadId: '',
    });
  }, [name, pushNotification]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 6000);
    return () => clearTimeout(t);
  }, [activeToast]);

  const markLeadRead = useCallback((leadId: string) => {
    setUnreadLeadIds((prev) => {
      if (!prev.has(leadId)) return prev;
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });
  }, []);

  const subscribeToMessages = useCallback((callback: (msg: Message) => void) => {
    messageListeners.current.add(callback);
    return () => {
      messageListeners.current.delete(callback);
    };
  }, []);

  const subscribeToLeads = useCallback((callback: (lead: Lead) => void) => {
    leadListeners.current.add(callback);
    return () => {
      leadListeners.current.delete(callback);
    };
  }, []);

  const subscribeToBookings = useCallback(
    (callback: (booking: Booking) => void) => {
      bookingListeners.current.add(callback);
      return () => {
        bookingListeners.current.delete(callback);
      };
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();

    // Seed initial assigned_agent_id map so we can detect assignment changes accurately
    supabase
      .from('leads')
      .select('id, assigned_agent_id')
      .then(({ data }) => {
        if (data) {
          data.forEach((row: { id: string; assigned_agent_id: string | null }) => {
            lastKnownAssignedMap.current.set(row.id, row.assigned_agent_id);
          });
        }
      });

    // Single realtime channel for the whole dashboard
    const channel = supabase
      .channel('balos-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          messageListeners.current.forEach((cb) => cb(newMsg));
          if (newMsg.sender === 'LEAD') {
            setUnreadLeadIds((prev) => {
              const next = new Set(prev);
              next.add(newMsg.lead_id);
              return next;
            });

            // If this lead is assigned to the logged-in agent, alert them
            const assignedTo = lastKnownAssignedMap.current.get(newMsg.lead_id);
            if (agentId && assignedTo === agentId) {
              pushNotification({
                type: 'NEW_MESSAGE',
                title: 'New WhatsApp message from your assigned lead',
                body:
                  newMsg.content?.slice(0, 90) ||
                  'Client sent a new WhatsApp message.',
                leadId: newMsg.lead_id,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          const updatedLead = payload.new as Lead;
          const oldLead = (payload.old || {}) as Partial<Lead>;
          if (updatedLead && updatedLead.id) {
            leadListeners.current.forEach((cb) => cb(updatedLead));

            const prevAssigned = lastKnownAssignedMap.current.has(updatedLead.id)
              ? lastKnownAssignedMap.current.get(updatedLead.id)
              : oldLead.assigned_agent_id;

            lastKnownAssignedMap.current.set(
              updatedLead.id,
              updatedLead.assigned_agent_id || null
            );

            const leadLabel =
              updatedLead.full_name && updatedLead.full_name !== '.'
                ? updatedLead.full_name
                : updatedLead.e164_phone ||
                  updatedLead.whatsapp_id ||
                  'WhatsApp Lead';

            // Detect new agent assignment in Supabase Realtime
            if (
              updatedLead.assigned_agent_id &&
              updatedLead.assigned_agent_id !== prevAssigned
            ) {
              if (agentId && updatedLead.assigned_agent_id === agentId) {
                pushNotification({
                  type: 'LEAD_ASSIGNED',
                  title: `New lead assigned to you: ${leadLabel}`,
                  body: `Stage: ${updatedLead.stage || 'NEW'} • Click to open conversation in Inbox.`,
                  leadId: updatedLead.id,
                });
              } else if (isLeader) {
                pushNotification({
                  type: 'LEAD_ASSIGNED',
                  title: `Lead assigned: ${leadLabel}`,
                  body: `Synced in Supabase and pushed to assigned agent.`,
                  leadId: updatedLead.id,
                });
              }
            } else if (
              updatedLead.stage === 'HANDOFF_TO_AGENT' &&
              oldLead.stage &&
              oldLead.stage !== 'HANDOFF_TO_AGENT' &&
              (!updatedLead.assigned_agent_id ||
                updatedLead.assigned_agent_id === agentId ||
                isLeader)
            ) {
              pushNotification({
                type: 'HANDOFF_ALERT',
                title: `Handoff requested: ${leadLabel}`,
                body:
                  updatedLead.handoff_reason ||
                  'Lead requested human broker assistance.',
                leadId: updatedLead.id,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          const booking = payload.new as Booking;
          if (booking && booking.id) {
            bookingListeners.current.forEach((cb) => cb(booking));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('CONNECTED');
          setRefetchTrigger((prev) => prev + 1);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('DISCONNECTED');
        } else {
          setConnectionStatus('CONNECTING');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, isLeader, pushNotification]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{
        connectionStatus,
        queueCount,
        setQueueCount,
        unreadLeadIds,
        markLeadRead,
        subscribeToMessages,
        subscribeToLeads,
        subscribeToBookings,
        refetchTrigger,
        notifications,
        unreadNotificationCount,
        markAllNotificationsRead,
        triggerDemoAssignmentNotification,
      }}
    >
      {children}

      {/* Apple-Style Translucent Floating Notification Toast */}
      {activeToast && (
        <div className="fixed top-16 right-4 md:right-8 z-50 w-80 sm:w-96 apple-glass rounded-2xl border border-border-strong shadow-apple p-4 transition-all duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-ink text-white flex items-center justify-center shrink-0 mt-0.5">
              {activeToast.type === 'LEAD_ASSIGNED' ? (
                <UserCheck className="w-4 h-4" />
              ) : activeToast.type === 'NEW_MESSAGE' ? (
                <MessageSquare className="w-4 h-4" />
              ) : (
                <BellRing className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                  {activeToast.type === 'LEAD_ASSIGNED'
                    ? 'Supabase Live Assignment'
                    : 'Live Alert'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="text-ink-soft hover:text-ink p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-bold text-ink mt-0.5 truncate">
                {activeToast.title}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">
                {activeToast.body}
              </p>
              {activeToast.leadId && (
                <Link
                  href={`/inbox?lead=${activeToast.leadId}`}
                  onClick={() => setActiveToast(null)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-ink hover:underline"
                >
                  <span>Open conversation</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

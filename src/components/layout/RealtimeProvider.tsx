'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Lead, Message, Booking, isLeadInQueue } from '../../lib/types';

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
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({
  children,
  initialQueueCount = 0,
}: {
  children: React.ReactNode;
  initialQueueCount?: number;
}) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [queueCount, setQueueCount] = useState<number>(initialQueueCount);
  const [unreadLeadIds, setUnreadLeadIds] = useState<Set<string>>(new Set());
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

  const messageListeners = useRef<Set<(msg: Message) => void>>(new Set());
  const leadListeners = useRef<Set<(lead: Lead) => void>>(new Set());
  const bookingListeners = useRef<Set<(booking: Booking) => void>>(new Set());

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

  const subscribeToBookings = useCallback((callback: (booking: Booking) => void) => {
    bookingListeners.current.add(callback);
    return () => {
      bookingListeners.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Single realtime channel for the whole dashboard
    const channel = supabase
      .channel('balos-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          // Notify listeners
          messageListeners.current.forEach((cb) => cb(newMsg));
          // Mark lead as having unread message
          if (newMsg.sender === 'LEAD') {
            setUnreadLeadIds((prev) => {
              const next = new Set(prev);
              next.add(newMsg.lead_id);
              return next;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          const updatedLead = payload.new as Lead;
          if (updatedLead && updatedLead.id) {
            leadListeners.current.forEach((cb) => cb(updatedLead));
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
          // On reconnect: bump refetchTrigger to catch anything missed while disconnected
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
  }, []);

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
      }}
    >
      {children}
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

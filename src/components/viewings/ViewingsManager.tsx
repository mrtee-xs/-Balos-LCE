'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Booking } from '../../lib/types';
import { useRealtime } from '../layout/RealtimeProvider';
import { formatDubaiDateTime } from '../../lib/date';
import { updateBookingStatus, updateBookingNotes } from '../../lib/actions/viewings';
import {
  Calendar,
  Video,
  Building,
  Users,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  AlertCircle,
  Save,
} from 'lucide-react';

interface ViewingsManagerProps {
  initialBookings: Booking[];
}

export function ViewingsManager({ initialBookings }: ViewingsManagerProps) {
  const router = useRouter();
  const { subscribeToBookings } = useRealtime();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  // Subscribe to real-time booking changes
  useEffect(() => {
    return subscribeToBookings((updatedBooking) => {
      setBookings((prev) => {
        const idx = prev.findIndex((b) => b.id === updatedBooking.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...updatedBooking };
          return next;
        } else {
          return [updatedBooking, ...prev];
        }
      });
    });
  }, [subscribeToBookings]);

  const nowIso = new Date().toISOString();

  const upcomingBookings = bookings
    .filter((b) => !b.scheduled_at || b.scheduled_at >= nowIso)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const pastBookings = bookings
    .filter((b) => b.scheduled_at && b.scheduled_at < nowIso)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const displayedBookings = tab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setStatusMessage(null);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as any } : b))
    );
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        setStatusMessage(`Booking marked as ${newStatus.toLowerCase()}.`);
        router.refresh();
      } else {
        setStatusMessage(res.error || 'Failed to update booking status.');
      }
    });
  };

  const handleStartEditingNotes = (booking: Booking) => {
    setEditingNotesId(booking.id);
    setNotesValue(booking.notes || '');
  };

  const handleSaveNotes = (bookingId: string) => {
    startTransition(async () => {
      const res = await updateBookingNotes(bookingId, notesValue);
      if (res.success) {
        setEditingNotesId(null);
        router.refresh();
      }
    });
  };

  const getViewTypeBadge = (type: string) => {
    switch (type) {
      case 'VIRTUAL_ZOOM_MEET':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-creek-light text-creek">
            <Video className="w-3.5 h-3.5" />
            Virtual walkthrough
          </span>
        );
      case 'OFFICE_CONSULTATION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-saffron-light text-saffron-hover">
            <Users className="w-3.5 h-3.5" />
            Office consultation
          </span>
        );
      case 'PHYSICAL_SITE_VISIT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-seaglass text-ink-muted">
            <Building className="w-3.5 h-3.5" />
            Site visit
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-creek-light text-creek';
      case 'COMPLETED':
        return 'bg-seaglass text-ink-muted';
      case 'CANCELLED':
        return 'bg-coral-light text-coral';
      case 'REQUESTED':
      default:
        return 'bg-saffron-light text-saffron-hover';
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
          <button
            onClick={() => setTab('upcoming')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition ${
              tab === 'upcoming'
                ? 'bg-creek text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setTab('past')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition ${
              tab === 'past'
                ? 'bg-creek text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-surface rounded-xl border border-border text-xs text-ink flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-ink-muted hover:text-ink text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bookings list */}
      <div className="space-y-3">
        {displayedBookings.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center text-xs text-ink-muted">
            {tab === 'upcoming'
              ? 'No upcoming viewings scheduled.'
              : 'No past viewings recorded.'}
          </div>
        ) : (
          displayedBookings.map((booking) => {
            const isVirtual = booking.viewing_type === 'VIRTUAL_ZOOM_MEET';
            const isEditingNotes = editingNotesId === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-3 hover:border-creek/30 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  {/* Left: Date & Type */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold font-heading text-ink">
                      {formatDubaiDateTime(booking.scheduled_at)}
                    </span>
                    {getViewTypeBadge(booking.viewing_type)}
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* Right: Join Button (ONLY for Virtual Walkthroughs) */}
                  <div className="flex items-center gap-2">
                    {isVirtual && booking.meeting_link && (
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Details Row: Lead and Property */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-ink-muted block mb-0.5">
                      Client / Lead
                    </span>
                    <p className="font-semibold text-ink">
                      {booking.lead?.full_name || 'Prospective client'}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {booking.lead?.e164_phone || 'Direct inquiry'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-ink-muted block mb-0.5">
                      Property
                    </span>
                    <p className="font-semibold text-ink">
                      {booking.property?.title || 'General consultation / Portfolio tour'}
                    </p>
                    {booking.property?.community && (
                      <p className="text-[11px] text-ink-muted">
                        {booking.property.community}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="pt-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-ink-muted">
                      Consultant notes
                    </span>
                    {!isEditingNotes && (
                      <button
                        onClick={() => handleStartEditingNotes(booking)}
                        className="text-[11px] text-creek hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit notes
                      </button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Add client requirements, viewing feedback, or special requests..."
                        className="w-full p-2.5 rounded-lg border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveNotes(booking.id)}
                          disabled={isPending}
                          className="px-3 py-1 rounded-md bg-creek text-white text-xs font-medium flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save notes
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1 rounded-md bg-seaglass text-ink-muted hover:text-ink text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-ink-muted text-xs bg-surface-subtle p-2.5 rounded-lg border border-border/60">
                      {booking.notes || 'No notes added for this viewing.'}
                    </p>
                  )}
                </div>

                {/* Status Actions & Calendar note */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <AlertCircle className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    <span>
                      Cancelling here does not remove the Google Calendar event.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {booking.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded-lg bg-surface hover:bg-seaglass border border-border text-xs text-ink font-medium flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-creek" />
                        Mark completed
                      </button>
                    )}

                    {booking.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded-lg bg-surface hover:bg-coral-light/40 border border-border hover:border-coral/30 text-xs text-coral font-medium flex items-center gap-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel viewing
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

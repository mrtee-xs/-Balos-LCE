'use client';

import Link from 'next/link';
import { Booking } from '../../lib/types';
import { formatDubaiDateTime } from '../../lib/date';
import { getPropertyPreview } from '../../lib/utils';
import { Calendar, ArrowRight, Video, Building, Users } from 'lucide-react';
import { useLanguage } from '../layout/LanguageProvider';

interface UpcomingViewingsSectionProps {
  viewings: Booking[];
}

export function UpcomingViewingsSection({ viewings }: UpcomingViewingsSectionProps) {
  const { t } = useLanguage();

  const getViewTypeBadge = (type: string) => {
    switch (type) {
      case 'VIRTUAL_ZOOM_MEET':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-creek-light text-creek">
            <Video className="w-3 h-3" />
            Virtual walkthrough
          </span>
        );
      case 'OFFICE_CONSULTATION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-saffron-light text-saffron-hover">
            <Users className="w-3 h-3" />
            Office consultation
          </span>
        );
      case 'PHYSICAL_SITE_VISIT':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-seaglass text-ink-muted">
            <Building className="w-3 h-3" />
            Site visit
          </span>
        );
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-creek" />
          <h2 className="text-sm font-semibold text-ink font-heading">
            {t.overview.upcomingViewings}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-seaglass text-ink-muted font-medium">
            {viewings.length}
          </span>
        </div>
        <Link
          href="/viewings"
          className="text-xs font-medium text-creek hover:underline flex items-center gap-1"
        >
          {t.overview.viewAll}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {viewings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
          <div className="w-10 h-10 rounded-lg bg-seaglass flex items-center justify-center text-ink-soft mb-2">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-ink">{t.overview.noUpcomingViewings}</p>
          <p className="text-[11px] text-ink-muted mt-0.5 max-w-xs">
            {t.overview.noUpcomingViewingsDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {viewings.slice(0, 5).map((booking) => {
            const propPreview = booking.property
              ? getPropertyPreview(booking.property)
              : null;

            return (
              <div
                key={booking.id}
                className="p-3 rounded-xl border border-border/70 bg-surface hover:bg-surface-subtle transition flex items-center gap-3"
              >
                {propPreview?.hasMedia ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-seaglass shrink-0 border border-border/60">
                    <img
                      src={propPreview.url}
                      alt={booking.property?.title || 'Property'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-seaglass flex items-center justify-center text-ink-muted shrink-0 border border-border/50">
                    <Building className="w-4 h-4" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-ink">
                      {formatDubaiDateTime(booking.scheduled_at)}
                    </span>
                    {getViewTypeBadge(booking.viewing_type)}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="truncate">
                      <span className="font-semibold text-ink">
                        {booking.lead?.full_name || 'Prospective buyer'}
                      </span>
                      {booking.property?.title && (
                        <span className="text-ink-muted truncate">
                          {' '}
                          • {booking.property.title}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-seaglass text-ink-muted shrink-0">
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

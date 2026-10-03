'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lead } from '../../lib/types';
import { formatDubaiDateTime } from '../../lib/date';
import { formatCompactAED } from '../../lib/utils';
import { Search, Filter, Bot, PauseCircle, ChevronRight } from 'lucide-react';

interface LeadsDirectoryProps {
  leads: Lead[];
}

export function LeadsDirectory({ leads }: LeadsDirectoryProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [tempFilter, setTempFilter] = useState<string>('ALL');

  const filteredLeads = leads.filter((lead) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = lead.full_name?.toLowerCase().includes(q);
      const phoneMatch = lead.e164_phone?.toLowerCase().includes(q);
      const waMatch = lead.whatsapp_id?.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !waMatch) return false;
    }

    // Stage match
    if (stageFilter !== 'ALL' && lead.stage !== stageFilter) {
      return false;
    }

    // Temperature match
    if (tempFilter !== 'ALL' && lead.temperature !== tempFilter) {
      return false;
    }

    return true;
  });

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'QUALIFIED':
        return 'bg-creek-light text-creek';
      case 'VIEWING_SCHEDULED':
        return 'bg-saffron-light text-saffron-hover';
      case 'HANDOFF_TO_AGENT':
        return 'bg-coral-light text-coral';
      case 'ENGAGED':
        return 'bg-creek-subtle text-creek';
      default:
        return 'bg-seaglass text-ink-muted';
    }
  };

  const getTempBadge = (temp: string) => {
    switch (temp) {
      case 'HOT':
        return 'text-coral font-bold';
      case 'WARM':
        return 'text-saffron-hover font-semibold';
      case 'COLD':
      default:
        return 'text-ink-muted';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or WhatsApp..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek transition"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Stage */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek transition"
          >
            <option value="ALL">All stages</option>
            <option value="NEW">New</option>
            <option value="ENGAGED">Engaged</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="VIEWING_SCHEDULED">Viewing scheduled</option>
            <option value="HANDOFF_TO_AGENT">Handoff to agent</option>
            <option value="CLOSED_WON">Closed won</option>
            <option value="CLOSED_LOST">Closed lost</option>
          </select>

          {/* Temperature */}
          <select
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek transition"
          >
            <option value="ALL">All temperatures</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-muted">
            No leads match your search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead className="bg-surface-subtle border-b border-border text-[11px] text-ink-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Score & Temp</th>
                  <th className="py-3 px-3">Budget</th>
                  <th className="py-3 px-3">Communities</th>
                  <th className="py-3 px-3">AI status</th>
                  <th className="py-3 px-4 text-right">Last message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.map((lead) => {
                  const budgetString =
                    lead.budget_aed_min || lead.budget_aed_max
                      ? `${formatCompactAED(lead.budget_aed_min)} - ${formatCompactAED(lead.budget_aed_max)}`
                      : 'Flexible';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-seaglass/40 cursor-pointer transition group relative"
                    >
                      {/* Name & Phone */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/inbox?lead=${lead.id}`}
                          prefetch={true}
                          className="font-semibold text-ink group-hover:text-creek transition block before:absolute before:inset-0 before:z-0"
                        >
                          {lead.full_name && lead.full_name !== '.'
                            ? lead.full_name
                            : 'Direct WhatsApp Lead'}
                        </Link>
                        <div className="text-[11px] text-ink-muted relative z-10 pointer-events-none">
                          {lead.e164_phone || lead.whatsapp_id}
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStageBadge(
                            lead.stage
                          )}`}
                        >
                          {lead.stage}
                        </span>
                      </td>

                      {/* Score & Temp */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-ink">
                          {lead.lead_score ?? 0}
                          <span className="text-[10px] font-normal text-ink-muted">/100</span>
                        </div>
                        <div className={`text-[10px] ${getTempBadge(lead.temperature)}`}>
                          {lead.temperature || 'COLD'}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3 px-3 font-medium">
                        {budgetString}
                      </td>

                      {/* Communities */}
                      <td className="py-3 px-3">
                        {lead.target_communities && lead.target_communities.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {lead.target_communities.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.2 rounded bg-seaglass text-[10px] text-ink-muted"
                              >
                                {c}
                              </span>
                            ))}
                            {lead.target_communities.length > 2 && (
                              <span className="text-[10px] text-ink-muted">
                                +{lead.target_communities.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>

                      {/* AI Status */}
                      <td className="py-3 px-3">
                        {lead.ai_paused ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-coral bg-coral-light px-2 py-0.5 rounded-full">
                            <PauseCircle className="w-3 h-3" />
                            Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-creek bg-creek-light px-2 py-0.5 rounded-full">
                            <Bot className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Last Message */}
                      <td className="py-3 px-4 text-right text-ink-muted">
                        <div className="text-[11px]">
                          {formatDubaiDateTime(lead.last_lead_message_at || lead.updated_at, {
                            short: true,
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

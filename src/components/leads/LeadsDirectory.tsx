'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lead,
  Agent,
  LEAD_STAGE_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  getLeadSourceMeta,
  isJunkOrSpamLead,
  canAssignLeads,
} from '../../lib/types';
import { useDashboard } from '../layout/DashboardContext';
import { useLanguage } from '../layout/LanguageProvider';
import { updateLeadStage, assignLeadAgent } from '../../lib/actions/leads';
import { formatDubaiDateTime } from '../../lib/date';
import { formatCompactAED } from '../../lib/utils';
import {
  Search,
  Bot,
  PauseCircle,
  Download,
  ShieldAlert,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface LeadsDirectoryProps {
  initialLeads: Lead[];
  agents?: Agent[];
}

export function LeadsDirectory({
  initialLeads,
  agents = [],
}: LeadsDirectoryProps) {
  const router = useRouter();
  const { role, isAdmin } = useDashboard();
  const { t } = useLanguage();
  const hasAssignPermission = canAssignLeads(role, isAdmin);

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [tempFilter, setTempFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [hideJunk, setHideJunk] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const junkCount = leads.filter((l) => isJunkOrSpamLead(l)).length;

  const filteredLeads = leads.filter((lead) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = lead.full_name?.toLowerCase().includes(q);
      const phoneMatch = lead.e164_phone?.toLowerCase().includes(q);
      const waMatch = lead.whatsapp_id?.toLowerCase().includes(q);
      const commMatch = lead.target_communities?.some((c) =>
        c.toLowerCase().includes(q)
      );
      if (!nameMatch && !phoneMatch && !waMatch && !commMatch) return false;
    }

    // Stage match
    if (stageFilter !== 'ALL' && lead.stage !== stageFilter) {
      return false;
    }

    // Temperature match
    if (tempFilter !== 'ALL' && lead.temperature !== tempFilter) {
      return false;
    }

    // Source match
    if (sourceFilter !== 'ALL') {
      const src = (lead.source || 'DIRECT_WHATSAPP').toUpperCase().trim();
      if (src !== sourceFilter) return false;
    }

    // Junk filter
    if (hideJunk && isJunkOrSpamLead(lead)) {
      return false;
    }

    return true;
  });

  const handleStageChange = (leadId: string, newStage: string) => {
    setFeedback(null);
    setSuccessNote(null);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );
    startTransition(async () => {
      const res = await updateLeadStage(leadId, newStage);
      if (res.success) {
        router.refresh();
      } else {
        setFeedback(res.error || 'Failed to update stage.');
      }
    });
  };

  const handleAgentChange = (leadId: string, newAgentId: string) => {
    if (!hasAssignPermission) {
      setFeedback(
        'Only leadership roles (Admin, Sales Leader, Team Leader) can assign leads to agents.'
      );
      return;
    }
    setFeedback(null);
    setSuccessNote(null);
    const val = newAgentId || null;
    const targetAgentName = agents.find((a) => a.id === val)?.name;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, assigned_agent_id: val } : l
      )
    );
    startTransition(async () => {
      const res = await assignLeadAgent(leadId, val);
      if (res.success) {
        if (targetAgentName) {
          setSuccessNote(
            `Assigned to ${targetAgentName} — saved in Supabase & real-time notification sent.`
          );
          setTimeout(() => setSuccessNote(null), 4000);
        }
        router.refresh();
      } else {
        setFeedback(res.error || 'Failed to assign agent.');
      }
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Phone',
      'Source',
      'Stage',
      'Score',
      'Temperature',
      'Min Budget (AED)',
      'Max Budget (AED)',
      'Target Communities',
      'Category',
      'Timeline',
      'Assigned Agent',
      'Notes',
      'Created At',
    ];

    const rows = filteredLeads.map((l) => {
      const agentName =
        agents.find((a) => a.id === l.assigned_agent_id)?.name || '';
      const src = getLeadSourceMeta(l.source).label;
      return [
        l.full_name || 'Direct WhatsApp Lead',
        l.e164_phone || l.whatsapp_id || '',
        src,
        l.stage || 'NEW',
        String(l.lead_score ?? 0),
        l.temperature || 'COLD',
        String(l.budget_aed_min ?? ''),
        String(l.budget_aed_max ?? ''),
        (l.target_communities || []).join('; '),
        l.target_category || '',
        l.timeline || '',
        agentName,
        (l.notes || '').replace(/\r?\n/g, ' '),
        l.created_at || '',
      ];
    });

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balos-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'QUALIFIED':
        return 'bg-creek-light text-creek';
      case 'VIEWING_SCHEDULED':
        return 'bg-saffron-light text-saffron-hover';
      case 'HANDOFF_TO_AGENT':
        return 'bg-coral-light text-coral';
      case 'CLOSED_WON':
        return 'bg-emerald-100 text-emerald-800';
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
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, community..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek transition"
          />
        </div>

        {/* Filter selectors & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek transition"
          >
            <option value="ALL">All sources</option>
            {LEAD_SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t.sources[opt.value] || opt.label}
              </option>
            ))}
          </select>

          {/* Stage */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek transition"
          >
            <option value="ALL">All stages</option>
            {LEAD_STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t.stages[opt.value] || opt.label}
              </option>
            ))}
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

          {/* Hide Junk / Spam Toggle */}
          <button
            type="button"
            onClick={() => setHideJunk((v) => !v)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition ${
              hideJunk
                ? 'bg-creek-light border-creek/40 text-creek'
                : 'bg-surface-pure border-border text-ink-muted hover:text-ink'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Hide junk ≤10</span>
            <span className="px-1.5 py-0.2 rounded-full bg-seaglass text-[10px] font-bold text-ink">
              {junkCount}
            </span>
          </button>

          {/* CRM CSV Export */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-border bg-surface-pure hover:bg-seaglass text-xs font-semibold text-ink inline-flex items-center gap-1.5 transition"
            title="Export filtered leads to CSV for CRM import"
          >
            <Download className="w-3.5 h-3.5 text-creek" />
            <span>{t.common.exportCsv}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-coral-light border border-coral/30 rounded-xl text-xs text-coral flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {successNote && (
        <div className="p-3 bg-surface border border-border-strong rounded-xl text-xs text-ink flex items-center justify-between shadow-xs">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {successNote}
          </span>
          <button
            type="button"
            onClick={() => setSuccessNote(null)}
            className="text-xs text-ink-muted hover:text-ink font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

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
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Score & Temp</th>
                  <th className="py-3 px-3">Budget</th>
                  <th className="py-3 px-3">Communities</th>
                  <th className="py-3 px-3">Assigned agent</th>
                  <th className="py-3 px-3">AI status</th>
                  <th className="py-3 px-4 text-right">Last message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.map((lead) => {
                  const budgetString =
                    lead.budget_aed_min || lead.budget_aed_max
                      ? `${formatCompactAED(lead.budget_aed_min)} - ${formatCompactAED(
                          lead.budget_aed_max
                        )}`
                      : 'Flexible';
                  const sourceMeta = getLeadSourceMeta(lead.source);
                  const isJunk = isJunkOrSpamLead(lead);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-seaglass/40 transition group"
                    >
                      {/* Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/inbox?lead=${lead.id}`}
                            prefetch={true}
                            className="font-semibold text-ink hover:text-creek transition"
                          >
                            {lead.full_name && lead.full_name !== '.'
                              ? lead.full_name
                              : 'Direct WhatsApp Lead'}
                          </Link>
                          {isJunk && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-seaglass text-ink-muted border border-border"
                              title="Low-intent or spam lead filtered from clogging agent phones"
                            >
                              Filtered
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          {lead.e164_phone || lead.whatsapp_id}
                        </div>
                      </td>

                      {/* Source Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${sourceMeta.badgeClass}`}
                          title={lead.source_detail || sourceMeta.label}
                        >
                          {sourceMeta.shortLabel}
                        </span>
                      </td>

                      {/* Inline Stage Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={lead.stage || 'NEW'}
                          disabled={isPending}
                          onChange={(e) =>
                            handleStageChange(lead.id, e.target.value)
                          }
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border border-transparent focus:outline-none focus:ring-2 focus:ring-creek/20 cursor-pointer ${getStageBadge(
                            lead.stage
                          )}`}
                        >
                          {LEAD_STAGE_OPTIONS.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="bg-surface text-ink font-normal"
                            >
                              {t.stages[opt.value] || opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Score & Temp */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-ink">
                          {lead.lead_score ?? 0}
                          <span className="text-[10px] font-normal text-ink-muted">
                            /100
                          </span>
                        </div>
                        <div
                          className={`text-[10px] ${getTempBadge(
                            lead.temperature
                          )}`}
                        >
                          {lead.temperature || 'COLD'}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3 px-3 font-medium whitespace-nowrap">
                        {budgetString}
                      </td>

                      {/* Communities */}
                      <td className="py-3 px-3">
                        {lead.target_communities &&
                        lead.target_communities.length > 0 ? (
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

                      {/* Inline Assigned Agent Selector (Leadership Only) */}
                      <td className="py-3 px-3">
                        {hasAssignPermission ? (
                          <select
                            value={lead.assigned_agent_id || ''}
                            disabled={isPending}
                            onChange={(e) =>
                              handleAgentChange(lead.id, e.target.value)
                            }
                            className="px-2 py-1 rounded-lg border border-border bg-surface-pure text-[11px] text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                          >
                            <option value="">Unassigned (AI)</option>
                            {agents.map((ag) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-seaglass/70 border border-border/60 text-[11px] text-ink-muted whitespace-nowrap"
                            title="Only Admin, Sales Leader, or Team Leader can assign agents"
                          >
                            <Lock className="w-2.5 h-2.5 text-ink-soft shrink-0" />
                            <span>
                              {agents.find(
                                (ag) => ag.id === lead.assigned_agent_id
                              )?.name || 'Unassigned (AI)'}
                            </span>
                          </span>
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
                      <td className="py-3 px-4 text-right text-ink-muted whitespace-nowrap">
                        <Link
                          href={`/inbox?lead=${lead.id}`}
                          className="text-[11px] hover:text-creek hover:underline"
                        >
                          {formatDubaiDateTime(
                            lead.last_lead_message_at || lead.updated_at,
                            {
                              short: true,
                            }
                          )}
                        </Link>
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

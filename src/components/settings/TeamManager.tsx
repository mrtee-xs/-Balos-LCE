'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Agent } from '../../lib/types';
import { toggleAgentActive, updateAgentRole } from '../../lib/actions/team';
import { useLanguage } from '../layout/LanguageProvider';
import {
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

interface TeamManagerProps {
  initialAgents: Agent[];
}

export function TeamManager({ initialAgents }: TeamManagerProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleToggleActive = (agent: Agent) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleAgentActive(agent.id, !agent.is_active);
      if (res.success) {
        setFeedback(`Updated status for ${agent.name}.`);
        router.refresh();
      } else {
        setFeedback(res.error || 'Failed to update agent status.');
      }
    });
  };

  const handleRoleChange = (
    agent: Agent,
    newRole: 'admin' | 'sales_leader' | 'team_leader' | 'agent'
  ) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateAgentRole(agent.id, newRole);
      if (res.success) {
        setFeedback(`Updated role for ${agent.name} to ${newRole.replace('_', ' ')}.`);
        router.refresh();
      } else {
        setFeedback(res.error || 'Failed to update role.');
      }
    });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Informational note */}
      <div className="p-4 bg-surface rounded-2xl border border-border flex items-start gap-3 text-xs text-ink">
        <Info className="w-4 h-4 text-creek shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-ink">
            Leadership & lead assignment permissions
          </p>
          <p className="text-ink-muted mt-0.5">
            Only leadership positions (<strong className="text-ink">Agency Admin</strong>, <strong className="text-ink">Sales Leader</strong>, and <strong className="text-ink">Team Leader</strong>) can assign or reassign leads to agents. Standard <strong className="text-ink">Licensed Agents</strong> can work their assigned leads and update stages/notes, but cannot reassign leads.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-creek-light border border-border-strong rounded-xl text-xs text-ink flex items-center justify-between">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs text-ink-muted hover:text-ink font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Agents Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-subtle flex items-center justify-between">
          <h3 className="text-sm font-bold font-heading text-ink flex items-center gap-2">
            <Users className="w-4 h-4 text-creek" />
            Licensed agents & leadership ({initialAgents.length})
          </h3>
        </div>

        {/* Mobile Agent Cards (< md) */}
        <div className="md:hidden divide-y divide-border/60">
          {initialAgents.map((agent) => {
            const isLeaderRole = ['admin', 'sales_leader', 'team_leader'].includes(
              (agent.role || '').toLowerCase()
            );
            return (
              <div key={agent.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-ink text-white font-semibold text-xs flex items-center justify-center shrink-0">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{agent.name}</p>
                      <p className="text-[11px] text-ink-muted truncate">{agent.email}</p>
                      <p className="text-[10px] text-ink-faint truncate">
                        {agent.phone || 'No phone'}
                        {agent.rera_brn ? ` • BRN: ${agent.rera_brn}` : ''}
                      </p>
                    </div>
                  </div>

                  {agent.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink bg-surface-muted border border-border px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-muted bg-seaglass px-2 py-0.5 rounded-full shrink-0">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <select
                      value={agent.role || 'agent'}
                      disabled={isPending}
                      onChange={(e) =>
                        handleRoleChange(
                          agent,
                          e.target.value as 'admin' | 'sales_leader' | 'team_leader' | 'agent'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-pure text-xs text-ink font-medium focus:outline-none focus:ring-2 focus:ring-creek/20"
                    >
                      <option value="agent">Licensed Agent</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="sales_leader">Sales Leader</option>
                      <option value="admin">Agency Principal</option>
                    </select>
                    {isLeaderRole && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ink text-white">
                        <ShieldCheck className="w-3 h-3" />
                        Can assign
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleActive(agent)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      agent.is_active
                        ? 'border border-border text-ink-muted hover:text-coral hover:border-coral/40 hover:bg-coral-light/30'
                        : 'bg-creek hover:bg-creek-hover text-white'
                    }`}
                  >
                    {agent.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-surface-subtle border-b border-border text-[11px] text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Agent name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Role & authority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {initialAgents.map((agent) => {
                const isLeaderRole = ['admin', 'sales_leader', 'team_leader'].includes(
                  (agent.role || '').toLowerCase()
                );
                return (
                <tr key={agent.id} className="hover:bg-seaglass/60 transition">
                  {/* Name */}
                  <td className="py-3.5 px-4 font-semibold text-ink">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-ink text-white font-medium text-xs flex items-center justify-center shrink-0">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span>{agent.name}</span>
                        {agent.rera_brn && (
                          <span className="text-[10px] text-ink-muted block">
                            BRN: {agent.rera_brn}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-3">
                    <div className="text-ink truncate">{agent.email}</div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {agent.phone || 'No phone'}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={agent.role || 'agent'}
                        disabled={isPending}
                        onChange={(e) =>
                          handleRoleChange(
                            agent,
                            e.target.value as 'admin' | 'sales_leader' | 'team_leader' | 'agent'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-border bg-surface-pure text-xs text-ink font-medium focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                      >
                        <option value="agent">Licensed Agent</option>
                        <option value="team_leader">Team Leader</option>
                        <option value="sales_leader">Sales Leader</option>
                        <option value="admin">Agency Principal</option>
                      </select>
                      {isLeaderRole && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ink text-white"
                          title="Can assign and reassign leads to agents"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Can assign
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {agent.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink bg-surface-muted border border-border px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-seaglass px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Toggle Active button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleActive(agent)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        agent.is_active
                          ? 'border border-border text-ink-muted hover:text-coral hover:border-coral/40 hover:bg-coral-light/30'
                          : 'bg-creek hover:bg-creek-hover text-white'
                      }`}
                    >
                      {agent.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

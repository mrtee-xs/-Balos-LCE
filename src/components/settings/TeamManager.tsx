'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Agent } from '../../lib/types';
import { toggleAgentActive, updateAgentRole } from '../../lib/actions/team';
import {
  Users,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface TeamManagerProps {
  initialAgents: Agent[];
}

export function TeamManager({ initialAgents }: TeamManagerProps) {
  const router = useRouter();
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

  const handleRoleChange = (agent: Agent, newRole: 'admin' | 'agent') => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateAgentRole(agent.id, newRole);
      if (res.success) {
        setFeedback(`Updated role for ${agent.name} to ${newRole}.`);
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
            Agent user provisioning
          </p>
          <p className="text-ink-muted mt-0.5">
            Team accounts are provisioned in Supabase Auth by your system administrator. Use this panel to toggle operational activation or assign administrative permissions.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-creek-light border border-creek/30 rounded-xl text-xs text-creek flex items-center justify-between">
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
            Licensed agents ({initialAgents.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-surface-subtle border-b border-border text-[11px] text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Agent name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {initialAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-seaglass/40 transition">
                  {/* Name */}
                  <td className="py-3.5 px-4 font-semibold text-ink">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-creek-light text-creek font-medium text-xs flex items-center justify-center shrink-0">
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
                    <select
                      value={agent.role}
                      disabled={isPending}
                      onChange={(e) =>
                        handleRoleChange(agent, e.target.value as 'admin' | 'agent')
                      }
                      className="px-2.5 py-1 rounded-lg border border-border bg-surface-pure text-xs text-ink font-medium capitalize focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {agent.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-creek bg-creek-light px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

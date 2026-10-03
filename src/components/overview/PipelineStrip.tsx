import React from 'react';
import { LeadStage } from '../../lib/types';

interface PipelineStripProps {
  stageCounts: Record<string, number>;
  totalLeads: number;
}

const STAGES_CONFIG: { stage: LeadStage; label: string; color: string; bg: string }[] = [
  { stage: 'NEW', label: 'New', color: '#7E9498', bg: 'bg-[#7E9498]' },
  { stage: 'ENGAGED', label: 'Engaged', color: '#0B6E6E', bg: 'bg-creek' },
  { stage: 'QUALIFIED', label: 'Qualified', color: '#2B8A8A', bg: 'bg-[#2B8A8A]' },
  { stage: 'VIEWING_SCHEDULED', label: 'Viewing scheduled', color: '#D9A21B', bg: 'bg-saffron' },
  { stage: 'HANDOFF_TO_AGENT', label: 'Handoff to agent', color: '#D14B3A', bg: 'bg-coral' },
  { stage: 'CLOSED_WON', label: 'Closed won', color: '#2E7D32', bg: 'bg-[#2E7D32]' },
  { stage: 'CLOSED_LOST', label: 'Closed lost', color: '#9E9E9E', bg: 'bg-[#9E9E9E]' },
];

export function PipelineStrip({ stageCounts, totalLeads }: PipelineStripProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-ink font-heading">
            Lead pipeline
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Distribution across conversion stages ({totalLeads} total leads)
          </p>
        </div>
      </div>

      {/* Proportional segments bar */}
      <div className="h-3 w-full bg-seaglass rounded-full overflow-hidden flex mb-4 border border-border/50">
        {totalLeads === 0 ? (
          <div className="w-full h-full bg-border/40" />
        ) : (
          STAGES_CONFIG.map(({ stage, bg }) => {
            const count = stageCounts[stage] || 0;
            if (count === 0) return null;
            const pct = Math.max((count / totalLeads) * 100, 2);
            return (
              <div
                key={stage}
                style={{ width: `${pct}%` }}
                className={`h-full ${bg} transition-all`}
                title={`${stage}: ${count}`}
              />
            );
          })
        )}
      </div>

      {/* Legend & counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {STAGES_CONFIG.map(({ stage, label, color }) => {
          const count = stageCounts[stage] || 0;
          return (
            <div
              key={stage}
              className="p-2.5 rounded-xl bg-surface-subtle border border-border/60 flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] text-ink-muted truncate font-medium">
                  {label}
                </span>
              </div>
              <span className="text-base font-bold text-ink font-heading">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

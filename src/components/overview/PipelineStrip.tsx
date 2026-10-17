'use client';

import React from 'react';
import { LeadStage } from '../../lib/types';
import { useLanguage } from '../layout/LanguageProvider';

interface PipelineStripProps {
  stageCounts: Record<string, number>;
  totalLeads: number;
}

const STAGES_CONFIG: { stage: LeadStage; color: string; bg: string }[] = [
  { stage: 'NEW', color: '#AEAEB2', bg: 'bg-[#AEAEB2]' },
  { stage: 'ENGAGED', color: '#636366', bg: 'bg-[#636366]' },
  { stage: 'QUALIFIED', color: '#3A3A3C', bg: 'bg-[#3A3A3C]' },
  { stage: 'VIEWING_SCHEDULED', color: '#1D1D1F', bg: 'bg-[#1D1D1F]' },
  { stage: 'HANDOFF_TO_AGENT', color: '#E11D48', bg: 'bg-coral' },
  { stage: 'CLOSED_WON', color: '#059669', bg: 'bg-emerald-600' },
  { stage: 'CLOSED_LOST', color: '#D1D1D6', bg: 'bg-[#D1D1D6]' },
];

export function PipelineStrip({ stageCounts, totalLeads }: PipelineStripProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-ink font-heading">
            {t.overview.pipelineTitle}
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {t.overview.pipelineSubtitle} ({totalLeads} {t.overview.totalLeads})
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
        {STAGES_CONFIG.map(({ stage, color }) => {
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
                  {t.stages[stage] || stage}
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

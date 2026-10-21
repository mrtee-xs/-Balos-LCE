'use client';

import { useState, useTransition } from 'react';
import { Agent, formatAgentRole } from '../../lib/types';
import { updateAgentProfile } from '../../lib/actions/team';
import {
  User,
  Phone,
  ShieldCheck,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';

const COMMON_LANGUAGES = [
  'English',
  'Arabic',
  'Russian',
  'French',
  'Hindi / Urdu',
  'Farsi',
  'German',
  'Italian',
  'Spanish',
  'Chinese (Mandarin)',
  'Turkish',
];

interface AgentProfileFormProps {
  agent: Agent;
}

export function AgentProfileForm({ agent }: AgentProfileFormProps) {
  const [phone, setPhone] = useState(agent.phone || '');
  const [reraBrn, setReraBrn] = useState(agent.rera_brn || '');
  const [languages, setLanguages] = useState<string[]>(
    agent.languages || ['English']
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      const res = await updateAgentProfile(agent.id, {
        phone,
        rera_brn: reraBrn,
        languages,
      });

      if (res.success) {
        setFeedback('Your agent profile and credentials have been updated successfully.');
      } else {
        setError(res.error || 'Failed to update profile. Please try again.');
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {/* Feedback alerts */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-coral-light border border-coral/30 rounded-2xl flex items-center gap-3 text-xs text-coral shadow-xs">
          <AlertCircle className="w-4 h-4 text-coral shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* RERA and AI Co-pilot Integration Notice */}
      <div className="p-4 bg-surface rounded-2xl border border-border flex items-start gap-3 text-xs text-ink shadow-xs">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-ink">
            DLD & WhatsApp AI Integration
          </p>
          <p className="text-ink-muted mt-0.5 leading-relaxed">
            Your verified RERA BRN and language fluencies are automatically included in automated viewing confirmation passes and agent handoff introductions sent to Dubai buyers.
          </p>
        </div>
      </div>

      {/* Account Verification (Read-Only) */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold font-heading text-ink flex items-center gap-2">
          <User className="w-4 h-4 text-ink-soft" />
          Agent Verification Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              value={agent.name}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-subtle text-xs text-ink font-medium cursor-not-allowed"
            />
            <span className="text-[10px] text-ink-faint mt-1 block">
              Managed by your Agency Principal
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Work Email Address
            </label>
            <input
              type="email"
              value={agent.email}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-subtle text-xs text-ink font-medium cursor-not-allowed"
            />
            <span className="text-[10px] text-ink-faint mt-1 block">
              Used for your Balos authentication
            </span>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
            System Role & Authority
          </label>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-seaglass text-xs font-semibold text-ink border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-creek" />
            {formatAgentRole(agent.role)}
          </span>
        </div>
      </div>

      {/* Editable Contact & Credentials */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold font-heading text-ink flex items-center gap-2">
          <Phone className="w-4 h-4 text-ink-soft" />
          Direct Contact & Dubai Licensing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1.5">
              WhatsApp / Mobile Phone (E.164)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971501234567"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
            <span className="text-[10px] text-ink-muted mt-1 block">
              Receives instant lead escalation alerts & client calls
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1.5">
              Dubai RERA BRN License No.
            </label>
            <input
              type="text"
              value={reraBrn}
              onChange={(e) => setReraBrn(e.target.value)}
              placeholder="e.g. 52410"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
            <span className="text-[10px] text-ink-muted mt-1 block">
              Broker Registration Number issued by DLD
            </span>
          </div>
        </div>

        {/* Spoken Languages */}
        <div className="pt-2">
          <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-ink-soft" />
            Spoken Languages
          </label>
          <p className="text-[11px] text-ink-muted mb-3">
            Select the languages you speak fluently to receive matching international buyer handoffs.
          </p>

          <div className="flex flex-wrap gap-2">
            {COMMON_LANGUAGES.map((lang) => {
              const selected = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleToggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    selected
                      ? 'bg-ink text-white border-ink shadow-xs'
                      : 'bg-surface text-ink-muted border-border hover:text-ink hover:bg-seaglass'
                  }`}
                >
                  {selected ? `✓ ${lang}` : `+ ${lang}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink-light transition flex items-center gap-2 shadow-xs disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving credentials...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile & Credentials</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

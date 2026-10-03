'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessInfo } from '../../lib/types';
import { useDashboard } from '../layout/DashboardContext';
import { updateBusinessInfo } from '../../lib/actions/business';
import {
  Building,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Phone,
  Mail,
  Globe,
  Sparkles,
  Lock,
} from 'lucide-react';

interface BusinessInfoFormProps {
  initialInfo: BusinessInfo;
}

export function BusinessInfoForm({ initialInfo }: BusinessInfoFormProps) {
  const router = useRouter();
  const { isAdmin } = useDashboard();

  const [formData, setFormData] = useState<BusinessInfo>(initialInfo);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof BusinessInfo, val: string) => {
    if (!isAdmin) return;
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await updateBusinessInfo(formData.id, formData);

    if (!res.success) {
      setError(res.error || 'Failed to update agency configuration.');
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-12">
      {/* Top Banner Alert */}
      <div className="p-4 bg-creek-light border border-creek/30 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-creek shrink-0 mt-0.5" />
        <div className="text-xs text-ink">
          <p className="font-semibold text-creek">
            Changes apply to the AI immediately.
          </p>
          <p className="text-ink-muted mt-0.5">
            The Balos AI lead engine references this identity, operating schedule, and escalation routing in real time.
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-3.5 bg-seaglass border border-border rounded-xl flex items-center gap-2 text-xs text-ink-muted">
          <Lock className="w-4 h-4 shrink-0" />
          <span>You have agent permissions (view-only). Only agency administrators can modify settings.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-coral-light border border-coral/30 rounded-xl text-xs text-coral flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-creek-light border border-creek/30 rounded-xl text-xs text-creek flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Business configuration saved successfully. Live AI context updated.</span>
        </div>
      )}

      {/* Agency Identity Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold font-heading text-ink border-b border-border/60 pb-2">
          Agency profile & focus
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink">
              Agency name
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.agency_name || ''}
              onChange={(e) => handleChange('agency_name', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink">
              Website
            </label>
            <input
              type="url"
              disabled={!isAdmin}
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>

          <div className="space-y-1 col-span-full">
            <label className="block text-xs font-semibold text-ink">
              Agency overview & focus
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Agency background and specialized areas..."
              className="w-full p-3 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>

          <div className="space-y-1 col-span-full">
            <label className="block text-xs font-semibold text-ink">
              Service areas & target communities
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formData.service_areas || ''}
              onChange={(e) => handleChange('service_areas', e.target.value)}
              placeholder="e.g. Downtown Dubai, Business Bay, Palm Jumeirah, Dubai Hills Estate"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>
        </div>
      </div>

      {/* Communications & Escalation Routing Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold font-heading text-ink border-b border-border/60 pb-2">
          Operations & contact routing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 col-span-full sm:col-span-1">
            <label className="block text-xs font-semibold text-ink">
              Alert contact phone
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={formData.contact_phone || ''}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="+971 50 000 0000"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
            {/* Required specific help text */}
            <p className="text-[11px] text-ink-muted mt-1 leading-normal">
              This number receives handoff and booking alerts. Use full international format. It must not be the WhatsApp number the AI runs on.
            </p>
          </div>

          <div className="space-y-1 col-span-full sm:col-span-1">
            <label className="block text-xs font-semibold text-ink">
              Contact email
            </label>
            <input
              type="email"
              disabled={!isAdmin}
              value={formData.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="concierge@agency.com"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>

          <div className="space-y-1 col-span-full sm:col-span-1">
            <label className="block text-xs font-semibold text-ink">
              Operating hours (Dubai GST)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formData.operating_hours || ''}
              onChange={(e) => handleChange('operating_hours', e.target.value)}
              placeholder="Mon-Sat, 9:00 AM - 7:00 PM GST"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>

          <div className="space-y-1 col-span-full sm:col-span-1">
            <label className="block text-xs font-semibold text-ink">
              Tone of voice
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formData.tone_of_voice || ''}
              onChange={(e) => handleChange('tone_of_voice', e.target.value)}
              placeholder="e.g. ultra-professional, consultative, rapid, high-energy"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>

          <div className="space-y-1 col-span-full">
            <label className="block text-xs font-semibold text-ink">
              Additional directives & notes
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={formData.additional_notes || ''}
              onChange={(e) => handleChange('additional_notes', e.target.value)}
              placeholder="e.g. Provide ROI projections and payment plans when requested. Offer Zoom consultations for international buyers."
              className="w-full p-3 rounded-xl border border-border bg-surface-pure text-xs text-ink disabled:bg-surface-subtle disabled:text-ink-muted focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
            />
          </div>
        </div>
      </div>

      {/* Save Button (Admin only) */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving changes...' : 'Save settings'}</span>
          </button>
        </div>
      )}
    </form>
  );
}

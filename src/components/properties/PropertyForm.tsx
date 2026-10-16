'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Property, PropertyCategory, PropertyMarketType, PropertyStatus } from '../../lib/types';
import { PROPERTY_COLUMNS, ColumnDefinition } from '../../lib/properties-schema';
import { saveProperty } from '../../lib/actions/properties';
import { MediaManager } from './MediaManager';
import { formatAED, extractPropertyImages } from '../../lib/utils';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
} from 'lucide-react';

interface PropertyFormProps {
  initialProperty?: Property;
  isNew?: boolean;
}

export function PropertyForm({ initialProperty, isNew = false }: PropertyFormProps) {
  const router = useRouter();

  // Initialize form data with all columns from the introspected schema
  const [formData, setFormData] = useState<Partial<Property>>(() => {
    if (initialProperty) {
      return {
        ...initialProperty,
        images: extractPropertyImages(initialProperty),
      };
    }
    return {
      title: '',
      developer: '',
      project_name: '',
      community: '',
      sub_community: '',
      category: 'APARTMENT',
      market_type: 'OFF_PLAN',
      price_aed: 0,
      bedrooms: 1,
      bathrooms: 1,
      size_sqft: 0,
      payment_plan: '',
      handover_date: '',
      service_charge_aed_sqft: 0,
      projected_roi: 0,
      golden_visa_eligible: false,
      trakheesi_permit_no: '',
      status: 'AVAILABLE',
      description: '',
      brochure_url: '',
      images: [],
      video_url: null,
    };
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Group columns
  const groups: Array<ColumnDefinition['group']> = [
    'Core details',
    'Pricing & investment',
    'Specifications',
    'Compliance & verification',
    'Marketing & media',
  ];

  // Auto-compute Golden Visa eligibility when price changes
  const handlePriceChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setFormData((prev) => ({
      ...prev,
      price_aed: safeVal,
      golden_visa_eligible: safeVal >= 2_000_000,
    }));
  };

  const handleFieldChange = (name: string, value: any) => {
    if (name === 'price_aed') {
      handlePriceChange(Number(value) || 0);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate required fields
    if (!formData.title || !formData.community) {
      setErrorMessage('Please provide a title and community.');
      return;
    }

    if (formData.price_aed === undefined || formData.price_aed < 0) {
      setErrorMessage('Price must be a non-negative number.');
      return;
    }

    // Check if price or status changed on an existing property
    if (!isNew && initialProperty) {
      const priceChanged = Number(formData.price_aed) !== Number(initialProperty.price_aed);
      const statusChanged = formData.status !== initialProperty.status;

      if (priceChanged || statusChanged) {
        setShowConfirmModal(true);
        return;
      }
    }

    // Proceed to save
    executeSave();
  };

  const executeSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    setShowConfirmModal(false);

    const res = await saveProperty(formData, isNew);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save property.');
      setSaving(false);
      return;
    }

    router.push('/properties');
    router.refresh();
  };

  const renderField = (col: ColumnDefinition) => {
    const val = (formData as any)[col.name] ?? '';

    if (col.type === 'media-images') {
      return (
        <MediaManager
          key={col.name}
          images={extractPropertyImages(formData)}
          videoUrl={formData.video_url || null}
          onImagesChange={(imgs) => handleFieldChange('images', imgs)}
          onVideoChange={(v) => handleFieldChange('video_url', v)}
        />
      );
    }

    // media-video is already rendered inside MediaManager together with images
    if (col.type === 'media-video') {
      return null;
    }

    if (col.type === 'boolean' || col.readOnly) {
      return (
        <div key={col.name} className="space-y-1">
          <label className="block text-xs font-semibold text-ink">
            {col.label}
          </label>
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-surface-subtle text-xs">
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                formData.golden_visa_eligible
                  ? 'bg-creek-light text-creek'
                  : 'bg-seaglass text-ink-muted'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {formData.golden_visa_eligible ? 'Eligible (Price >= AED 2M)' : 'Not eligible'}
            </span>
          </div>
          {col.helpText && (
            <p className="text-[11px] text-ink-muted">{col.helpText}</p>
          )}
        </div>
      );
    }

    if (col.type === 'select') {
      return (
        <div key={col.name} className="space-y-1">
          <label className="block text-xs font-semibold text-ink">
            {col.label} {col.required && <span className="text-coral">*</span>}
          </label>
          <select
            value={val}
            onChange={(e) => handleFieldChange(col.name, e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
          >
            {col.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {col.helpText && (
            <p className="text-[11px] text-ink-muted">{col.helpText}</p>
          )}
        </div>
      );
    }

    if (col.type === 'textarea') {
      return (
        <div key={col.name} className="space-y-1 col-span-full">
          <label className="block text-xs font-semibold text-ink">
            {col.label} {col.required && <span className="text-coral">*</span>}
          </label>
          <textarea
            value={val}
            rows={4}
            placeholder={col.placeholder}
            onChange={(e) => handleFieldChange(col.name, e.target.value)}
            className="w-full p-3 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
          />
        </div>
      );
    }

    return (
      <div key={col.name} className="space-y-1">
        <label className="block text-xs font-semibold text-ink">
          {col.label} {col.required && <span className="text-coral">*</span>}
        </label>
        <input
          type={col.type === 'number' ? 'number' : 'text'}
          min={col.min}
          step={col.step}
          value={val}
          placeholder={col.placeholder}
          onChange={(e) => handleFieldChange(col.name, e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
        />
        {col.helpText && (
          <p className="text-[11px] text-ink-muted">{col.helpText}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-12">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to properties
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : isNew ? 'Create property' : 'Save changes'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-coral-light border border-coral/30 rounded-xl text-xs text-coral flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grouped field cards */}
      {groups.map((groupName) => {
        const groupCols = PROPERTY_COLUMNS.filter((c) => c.group === groupName);
        if (groupCols.length === 0) return null;

        return (
          <div
            key={groupName}
            className="bg-surface rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-4"
          >
            <div className="border-b border-border/60 pb-2.5">
              <h3 className="text-sm font-bold font-heading text-ink">
                {groupName}
              </h3>
            </div>

            <div
              className={`grid grid-cols-1 ${
                groupName === 'Marketing & media'
                  ? 'grid-cols-1'
                  : 'sm:grid-cols-2 md:grid-cols-3'
              } gap-4`}
            >
              {groupCols.map((col) => renderField(col))}
            </div>
          </div>
        );
      })}

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-creek hover:bg-creek-hover text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : isNew ? 'Create property' : 'Save changes'}</span>
        </button>
      </div>

      {/* Confirmation Modal when Price or Status changes */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-saffron-light text-saffron-hover flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold font-heading text-ink">
                Confirm price or status change
              </h3>
              <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                The AI will use this immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl bg-seaglass text-ink hover:bg-border/60 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold transition"
              >
                Confirm and save
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

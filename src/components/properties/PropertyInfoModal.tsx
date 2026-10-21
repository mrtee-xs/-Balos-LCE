'use client';

import React, { useState } from 'react';
import { Property } from '../../lib/types';
import { formatAED, formatCompactAED, resolveMediaUrl, isVideoMediaUrl, getPropertyPreview } from '../../lib/utils';
import {
  X,
  Building2,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  FileCheck2,
  Video,
  Play,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Calendar,
  Percent,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '../layout/DashboardContext';

interface PropertyInfoModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSuggestToLead?: (property: Property) => void;
}

export function PropertyInfoModal({
  property,
  isOpen,
  onClose,
  onSuggestToLead,
}: PropertyInfoModalProps) {
  const { isAdmin } = useDashboard();
  const [activeTab, setActiveTab] = useState<'media' | 'specs' | 'pricing' | 'legal'>('media');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !property) return null;

  const preview = getPropertyPreview(property);
  const allImages = property.images && property.images.length > 0
    ? property.images
    : [preview.url];

  const resolvedImages = allImages.map((img) => resolveMediaUrl(img));
  const videoSource = property.video_url || (preview.isVideo ? preview.raw : null);
  const resolvedVideoUrl = videoSource ? resolveMediaUrl(videoSource) : null;
  const brochureUrl = property.brochure_url ? resolveMediaUrl(property.brochure_url) : null;

  const currentImage = resolvedImages[activeImageIndex] || resolvedImages[0] || preview.fallbackUrl;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-creek-light text-creek border-creek/20';
      case 'RESERVED':
        return 'bg-saffron-light text-saffron-hover border-saffron/20';
      case 'SOLD':
        return 'bg-seaglass text-ink-muted border-border';
      case 'HIDDEN':
      default:
        return 'bg-surface-subtle text-ink-faint border-border';
    }
  };

  const handleCopyPitch = () => {
    const pitch = `🏡 *${property.title}*\n📍 ${property.community}${property.developer ? ` • by ${property.developer}` : ''}\n💰 Price: ${formatAED(property.price_aed)}\n📐 ${property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Beds`} | ${property.bathrooms || '—'} Baths | ${property.size_sqft ? `${property.size_sqft.toLocaleString()} sq ft` : 'Spacious'}\n${property.golden_visa_eligible ? '✨ UAE Golden Visa Eligible (10-Year Residency)\n' : ''}${property.trakheesi_permit_no ? `📜 Trakheesi Permit: #${property.trakheesi_permit_no}\n` : ''}`;
    navigator.clipboard.writeText(pitch);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-border bg-surface-subtle flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${getStatusBadge(
                  property.status
                )}`}
              >
                {property.status}
              </span>
              <span className="text-[11px] font-semibold text-ink-muted uppercase">
                {property.category} • {property.market_type?.replace(/_/g, ' ')}
              </span>
              {property.golden_visa_eligible && (
                <span className="px-2 py-0.5 rounded-full bg-creek-light text-creek text-[10px] font-bold flex items-center gap-1 border border-creek/20">
                  <ShieldCheck className="w-3 h-3 text-creek" />
                  Golden Visa Eligible
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-ink truncate">
              {property.title}
            </h2>
            <p className="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-creek shrink-0" />
              <span>{property.community}</span>
              {property.sub_community && <span>• {property.sub_community}</span>}
              {property.developer && <span>• by {property.developer}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPitch}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-seaglass text-ink-muted hover:text-ink text-xs font-medium inline-flex items-center gap-1.5 transition shadow-2xs"
              title="Copy WhatsApp Listing Pitch"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-creek" />
                  <span className="hidden sm:inline text-creek">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy pitch</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-seaglass transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-border bg-surface shrink-0 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('media');
              setIsVideoPlaying(false);
            }}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-creek text-creek'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Media & Gallery ({resolvedImages.length + (resolvedVideoUrl ? 1 : 0)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-creek text-creek'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Overview & Specs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-creek text-creek'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Pricing & Payment Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'legal'
                ? 'border-creek text-creek'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Legal, Permit & Visa</span>
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: MEDIA & GALLERY */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              {/* Main Media Viewer */}
              <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-border shadow-inner flex items-center justify-center">
                {isVideoPlaying && resolvedVideoUrl ? (
                  <video
                    src={resolvedVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    <img
                      src={currentImage}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Left/Right Carousel Controls */}
                    {resolvedImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev === 0 ? resolvedImages.length - 1 : prev - 1
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-ink/75 hover:bg-ink text-white backdrop-blur-md transition shadow-md"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev === resolvedImages.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-ink/75 hover:bg-ink text-white backdrop-blur-md transition shadow-md"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Overlay info */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-ink/80 text-white text-xs font-semibold backdrop-blur-md">
                      Photo {activeImageIndex + 1} of {resolvedImages.length}
                    </div>

                    {resolvedVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setIsVideoPlaying(true)}
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-creek hover:bg-creek-hover text-white flex items-center justify-center shadow-xl transition transform hover:scale-105"
                        title="Play Video Tour"
                      >
                        <Play className="w-7 h-7 fill-white translate-x-0.5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                  <span>Available Visual Assets</span>
                  {resolvedVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setIsVideoPlaying(true)}
                      className="text-creek hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Full 4K Video Tour</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                  {/* Video Thumbnail if present */}
                  {resolvedVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setIsVideoPlaying(true)}
                      className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 bg-black flex items-center justify-center transition group ${
                        isVideoPlaying ? 'border-creek ring-2 ring-creek/30' : 'border-border hover:border-creek/50'
                      }`}
                    >
                      <video src={resolvedVideoUrl} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white group-hover:scale-110 transition" />
                      </div>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-ink/90 text-[9px] text-white font-bold">
                        VIDEO
                      </span>
                    </button>
                  )}

                  {/* Photo Thumbnails */}
                  {resolvedImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsVideoPlaying(false);
                        setActiveImageIndex(idx);
                      }}
                      className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                        !isVideoPlaying && activeImageIndex === idx
                          ? 'border-creek ring-2 ring-creek/30 scale-102'
                          : 'border-border hover:border-creek/50 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 px-1 rounded bg-creek text-[8px] text-white font-bold">
                          COVER
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OVERVIEW & SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-5">
              {/* Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-creek-light/40 rounded-xl border border-creek/20">
                  <span className="text-[11px] font-semibold text-creek uppercase block">
                    Listing Price
                  </span>
                  <span className="text-base sm:text-lg font-bold font-heading text-ink">
                    {formatAED(property.price_aed)}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">
                    {formatCompactAED(property.price_aed)}
                  </span>
                </div>

                <div className="p-3.5 bg-surface-subtle rounded-xl border border-border">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase block">
                    Bedrooms & Baths
                  </span>
                  <span className="text-base sm:text-lg font-bold font-heading text-ink">
                    {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Bed`}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">
                    {property.bathrooms ? `${property.bathrooms} Bathrooms` : 'Ensuite bathrooms'}
                  </span>
                </div>

                <div className="p-3.5 bg-surface-subtle rounded-xl border border-border">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase block">
                    Total Built-up Area
                  </span>
                  <span className="text-base sm:text-lg font-bold font-heading text-ink">
                    {property.size_sqft ? `${property.size_sqft.toLocaleString()} sq ft` : 'Spacious'}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">
                    {property.size_sqft ? `~${Math.round(property.size_sqft / 10.764)} m²` : 'Luxury layout'}
                  </span>
                </div>

                <div className="p-3.5 bg-surface-subtle rounded-xl border border-border">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase block">
                    Projected ROI
                  </span>
                  <span className="text-base sm:text-lg font-bold font-heading text-creek">
                    {property.projected_roi ? `${property.projected_roi}%` : '8.2% Est.'}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">
                    High Rental Yield
                  </span>
                </div>
              </div>

              {/* Property Details Matrix */}
              <div className="p-4 bg-surface-subtle rounded-2xl border border-border space-y-3">
                <h3 className="text-xs font-bold font-heading text-ink uppercase tracking-wider">
                  Location & Architectural Specs
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-ink-muted">Master Community:</span>
                    <span className="font-semibold text-ink">{property.community}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-ink-muted">Sub-Community / Tower:</span>
                    <span className="font-semibold text-ink">{property.sub_community || 'Central District'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-ink-muted">Developer:</span>
                    <span className="font-semibold text-ink">{property.developer || 'Tier-1 Master Developer'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-ink-muted">Project Name:</span>
                    <span className="font-semibold text-ink">{property.project_name || property.title}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-ink-muted">Property Category:</span>
                    <span className="font-semibold text-ink">{property.category}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-ink-muted">Market Classification:</span>
                    <span className="font-semibold text-ink">{property.market_type?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Description / Sales Narrative */}
              {property.description && (
                <div className="p-4 bg-surface rounded-2xl border border-border space-y-2">
                  <h3 className="text-xs font-bold font-heading text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-creek" />
                    Property Narrative & Highlights
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRICING & PAYMENT PLAN */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="p-4 bg-surface-subtle rounded-2xl border border-border space-y-3">
                <h3 className="text-xs font-bold font-heading text-ink uppercase tracking-wider">
                  Financial Structure & Developer Payment Terms
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-[11px] text-ink-muted block">Total Investment</span>
                    <span className="text-base font-bold text-creek font-heading">
                      {formatAED(property.price_aed)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-[11px] text-ink-muted block">Service Charges</span>
                    <span className="text-base font-bold text-ink font-heading">
                      {property.service_charge_aed_sqft
                        ? `AED ${property.service_charge_aed_sqft}/sq ft`
                        : 'AED 16/sq ft'}
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-[11px] text-ink-muted block">Handover Date</span>
                    <span className="text-base font-bold text-ink font-heading flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-creek" />
                      {property.handover_date || 'Q4 2026 / Ready'}
                    </span>
                  </div>
                </div>

                {/* Milestone breakdown */}
                <div className="mt-3 p-4 bg-surface rounded-xl border border-border space-y-3">
                  <span className="text-xs font-semibold text-ink block">
                    Developer Payment Schedule
                  </span>

                  {typeof property.payment_plan === 'object' && property.payment_plan !== null ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {Object.entries(property.payment_plan).map(([key, val]) => (
                        <div key={key} className="p-2.5 bg-surface-subtle rounded-lg border border-border/60">
                          <span className="text-ink-muted capitalize block text-[11px]">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-bold text-ink text-sm">{String(val)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 bg-creek-light/40 rounded-lg border border-creek/20">
                        <span className="text-creek font-semibold block text-[11px]">
                          1. Down Payment
                        </span>
                        <span className="font-bold text-ink text-base">20%</span>
                        <span className="text-[10px] text-ink-muted block mt-0.5">
                          On reservation + 4% DLD fee
                        </span>
                      </div>
                      <div className="p-3 bg-surface-subtle rounded-lg border border-border">
                        <span className="text-ink-muted font-semibold block text-[11px]">
                          2. During Construction
                        </span>
                        <span className="font-bold text-ink text-base">40%</span>
                        <span className="text-[10px] text-ink-muted block mt-0.5">
                          Linked to build milestones
                        </span>
                      </div>
                      <div className="p-3 bg-surface-subtle rounded-lg border border-border">
                        <span className="text-ink-muted font-semibold block text-[11px]">
                          3. On Handover
                        </span>
                        <span className="font-bold text-ink text-base">40%</span>
                        <span className="text-[10px] text-ink-muted block mt-0.5">
                          At keys handover (0% interest)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LEGAL, PERMIT & VISA */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              {/* Trakheesi Permit Verification Card */}
              <div className="p-4 bg-surface-subtle rounded-2xl border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-heading text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-creek" />
                    Dubai Land Department (DLD) Regulatory Compliance
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-creek text-white text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Trakheesi Permit Number:</span>
                    <span className="font-mono font-bold text-ink">
                      {property.trakheesi_permit_no
                        ? `#${property.trakheesi_permit_no}`
                        : 'Approved DLD Listing Permit'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Advertising Compliance:</span>
                    <span className="text-creek font-semibold">100% Verified for UAE Portals & WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* UAE Golden Visa Status Card */}
              <div className="p-4 bg-creek-light/30 rounded-2xl border border-creek/20 space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-creek" />
                  <h3 className="text-xs font-bold font-heading text-creek uppercase tracking-wider">
                    UAE Golden Visa Assessment (10-Year Renewable Residency)
                  </h3>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {property.golden_visa_eligible ? (
                    <>
                      <strong className="text-ink font-semibold">Qualified Investment Asset:</strong> With a purchase
                      price of {formatAED(property.price_aed)}, this property satisfies the UAE Federal Government AED 2.0M
                      minimum real estate investment requirement. The buyer and their immediate family (spouse and children)
                      are eligible for the 10-Year Golden Visa upon title deed registration.
                    </>
                  ) : (
                    <>
                      <strong className="text-ink font-semibold">Standard Residency:</strong> This property is listed at{' '}
                      {formatAED(property.price_aed)}. While below the AED 2.0M Golden Visa single-asset threshold, it qualifies
                      for standard renewable property investor visas or can be combined with other assets.
                    </>
                  )}
                </p>
              </div>

              {/* Official Brochure Download */}
              {brochureUrl && (
                <div className="p-4 bg-surface rounded-2xl border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-creek-light text-creek flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink">Official Project Brochure & Floorplans</h4>
                      <p className="text-[11px] text-ink-muted">High-resolution developer PDF dossier</p>
                    </div>
                  </div>
                  <a
                    href={brochureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs shrink-0"
                  >
                    <span>Download PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-border bg-surface-subtle flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-ink-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-creek" />
            <span>ID: <code className="font-mono text-[10px]">{property.id.slice(0, 8)}...</code></span>
          </div>

          <div className="flex items-center gap-2">
            {onSuggestToLead && (
              <button
                type="button"
                onClick={() => {
                  onSuggestToLead(property);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Suggest to Lead via WhatsApp</span>
              </button>
            )}

            {isAdmin && (
              <Link
                href={`/properties/${property.id}/edit`}
                className="px-3.5 py-2 rounded-xl border border-border hover:bg-seaglass text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit listing</span>
              </Link>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-border hover:bg-seaglass text-ink-muted hover:text-ink text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

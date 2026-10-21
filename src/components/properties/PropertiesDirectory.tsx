'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Property } from '../../lib/types';
import { useDashboard } from '../layout/DashboardContext';
import { LiveDemoModal } from '../overview/LiveDemoModal';
import {
  formatAED,
  resolveMediaUrl,
  isVideoMediaUrl,
  getPropertyPreview,
} from '../../lib/utils';
import {
  Search,
  Plus,
  Building2,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Edit,
  FileCheck2,
  Video,
  Play,
  X,
  Image as ImageIcon,
  Info,
} from 'lucide-react';
import { PropertyInfoModal } from './PropertyInfoModal';

interface PropertiesDirectoryProps {
  properties: Property[];
}

export function PropertiesDirectory({ properties }: PropertiesDirectoryProps) {
  const { isAdmin } = useDashboard();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [goldenVisaOnly, setGoldenVisaOnly] = useState(false);
  const [failedMediaIds, setFailedMediaIds] = useState<Record<string, boolean>>(
    {}
  );
  const [activeVideo, setActiveVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [selectedInfoProperty, setSelectedInfoProperty] = useState<Property | null>(null);

  const filtered = properties.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchComm = p.community?.toLowerCase().includes(q);
      const matchDev = p.developer?.toLowerCase().includes(q);
      const matchPermit = p.trakheesi_permit_no?.toLowerCase().includes(q);
      if (!matchTitle && !matchComm && !matchDev && !matchPermit) return false;
    }

    if (statusFilter !== 'ALL' && p.status !== statusFilter) {
      return false;
    }

    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
      return false;
    }

    if (goldenVisaOnly && !p.golden_visa_eligible) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-creek-light text-creek';
      case 'RESERVED':
        return 'bg-saffron-light text-saffron-hover';
      case 'SOLD':
        return 'bg-seaglass text-ink-muted';
      case 'HIDDEN':
      default:
        return 'bg-surface-subtle text-ink-faint';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-ink">
            Property inventory
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Active DLD/Trakheesi-verified portfolio synced directly to Balos WhatsApp AI
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <LiveDemoModal
            buttonVariant="outline"
            buttonLabel="Test live AI bot"
          />

          {/* Admin only New Property button */}
          {isAdmin && (
            <Link
              href="/properties/new"
              className="px-4 py-2 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New property</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, community, developer, Trakheesi..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
          >
            <option value="ALL">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="HIDDEN">Hidden</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface-pure text-xs text-ink focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
          >
            <option value="ALL">All categories</option>
            <option value="APARTMENT">Apartments</option>
            <option value="VILLA">Villas</option>
            <option value="TOWNHOUSE">Townhouses</option>
            <option value="PENTHOUSE">Penthouses</option>
            <option value="DUPLEX">Duplexes</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>

          {/* Golden Visa Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-ink font-medium cursor-pointer px-2 py-1.5 rounded-lg hover:bg-seaglass">
            <input
              type="checkbox"
              checked={goldenVisaOnly}
              onChange={(e) => setGoldenVisaOnly(e.target.checked)}
              className="rounded border-border text-creek focus:ring-creek"
            />
            <span>Golden Visa eligible</span>
          </label>
        </div>
      </div>

      {/* Grid of Properties */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center text-xs text-ink-muted">
          No properties found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((property) => {
            const preview = getPropertyPreview(property);
            const coverMedia = preview.url;
            const priceFormatted = formatAED(property.price_aed);
            const videoSource =
              property.video_url || (preview.isVideo ? preview.raw : null);
            const resolvedVideoUrl = videoSource
              ? resolveMediaUrl(videoSource)
              : null;

            return (
              <div
                key={property.id}
                className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col hover:border-creek/40 transition group"
              >
                {/* Photo Header with Real Database Property Asset */}
                <div
                  onClick={() => setSelectedInfoProperty(property)}
                  className="relative h-48 bg-seaglass overflow-hidden cursor-pointer"
                  title="Click to view full property details, gallery & videos"
                >
                  <img
                    src={
                      failedMediaIds[property.id]
                        ? preview.fallbackUrl
                        : coverMedia
                    }
                    alt={property.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    onError={() => {
                      if (!failedMediaIds[property.id]) {
                        setFailedMediaIds((prev) => ({
                          ...prev,
                          [property.id]: true,
                        }));
                      }
                    }}
                  />

                  {/* Status & Media Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${getStatusBadge(
                        property.status
                      )}`}
                    >
                      {property.status}
                    </span>
                    {resolvedVideoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveVideo({
                            url: resolvedVideoUrl,
                            title: property.title,
                          })
                        }
                        className="px-2.5 py-1 rounded-full bg-ink/80 hover:bg-ink text-white text-[10px] font-semibold inline-flex items-center gap-1.5 backdrop-blur-md shadow-xs transition cursor-pointer"
                        title="Watch full video tour"
                      >
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                        <span>Video tour</span>
                      </button>
                    )}
                    {preview.totalImages > 1 && !resolvedVideoUrl && (
                      <span className="px-2.5 py-1 rounded-full bg-ink/75 text-white text-[10px] font-semibold inline-flex items-center gap-1.5 backdrop-blur-md shadow-xs">
                        <ImageIcon className="w-3 h-3" />
                        <span>{preview.totalImages} photos</span>
                      </span>
                    )}
                  </div>

                  {/* Golden Visa Badge */}
                  {property.golden_visa_eligible && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-surface/90 backdrop-blur-xs text-creek text-[10px] font-bold shadow-xs flex items-center gap-1 border border-creek/20">
                      <ShieldCheck className="w-3 h-3 text-creek" />
                      Golden Visa
                    </div>
                  )}

                  {/* Trakheesi Permit Pill Overlay */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-xs text-[10px] font-semibold text-ink border border-border/70 inline-flex items-center gap-1 shadow-xs">
                      <FileCheck2 className="w-3 h-3 text-creek" />
                      {property.trakheesi_permit_no
                        ? `Trakheesi #${property.trakheesi_permit_no}`
                        : 'Trakheesi permit pending'}
                    </span>
                    {property.projected_roi && (
                      <span className="px-2 py-0.5 rounded-md bg-creek text-white text-[10px] font-bold shadow-xs">
                        {property.projected_roi}% Est. ROI
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Non-wrapping AED price + truncated category/market */}
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-base font-bold font-heading text-creek whitespace-nowrap shrink-0">
                        {priceFormatted}
                      </span>
                      <span className="text-[10px] font-medium text-ink-muted uppercase truncate text-right">
                        {property.category} •{' '}
                        {property.market_type?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3
                      onClick={() => setSelectedInfoProperty(property)}
                      className="font-bold text-sm text-ink font-heading line-clamp-1 hover:text-creek cursor-pointer transition"
                      title="View property details"
                    >
                      {property.title}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-1">
                      {property.community}
                      {property.sub_community
                        ? `, ${property.sub_community}`
                        : ''}
                      {property.developer ? ` • by ${property.developer}` : ''}
                    </p>
                  </div>

                  {/* Specs row */}
                  <div className="flex items-center gap-4 text-xs text-ink-muted pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-ink-soft" />
                      <span>
                        {property.bedrooms === 0
                          ? 'Studio'
                          : `${property.bedrooms} beds`}
                      </span>
                    </div>
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-ink-soft" />
                        <span>{property.bathrooms} baths</span>
                      </div>
                    )}
                    {property.size_sqft && (
                      <div className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-ink-soft" />
                        <span>{property.size_sqft.toLocaleString()} sq ft</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Property Info + Video Tour + WhatsApp + Admin Edit */}
                  <div className="pt-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedInfoProperty(property)}
                      className="w-full py-2 px-3 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Property information</span>
                    </button>

                    {resolvedVideoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveVideo({
                            url: resolvedVideoUrl,
                            title: property.title,
                          })
                        }
                        className="w-full py-1.5 px-3 rounded-lg border border-border hover:bg-seaglass text-xs font-semibold text-ink flex items-center justify-center gap-1.5 transition"
                      >
                        <Video className="w-3.5 h-3.5 text-creek" />
                        <span>Watch video tour</span>
                      </button>
                    )}

                    <LiveDemoModal
                      propertyContext={{
                        title: property.title,
                        community: property.community,
                        priceFormatted,
                        permitNo: property.trakheesi_permit_no,
                      }}
                      buttonVariant="card"
                      buttonLabel="Test listing in WhatsApp"
                    />

                    {isAdmin && (
                      <Link
                        href={`/properties/${property.id}/edit`}
                        className="w-full py-1.5 px-3 rounded-lg border border-border hover:bg-seaglass text-xs font-semibold text-ink flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit property
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Tour Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-subtle">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-creek" />
                <h3 className="text-sm font-bold text-ink font-heading line-clamp-1">
                  {activeVideo.title} — Video tour
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-seaglass transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                src={activeVideo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Property Information Detailed Modal */}
      <PropertyInfoModal
        property={selectedInfoProperty}
        isOpen={Boolean(selectedInfoProperty)}
        onClose={() => setSelectedInfoProperty(null)}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Property } from '../../lib/types';
import { useDashboard } from '../layout/DashboardContext';
import { formatAED, resolveMediaUrl } from '../../lib/utils';
import {
  Search,
  Plus,
  Building2,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Edit,
  ExternalLink,
} from 'lucide-react';

interface PropertiesDirectoryProps {
  properties: Property[];
}

export function PropertiesDirectory({ properties }: PropertiesDirectoryProps) {
  const { isAdmin } = useDashboard();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [goldenVisaOnly, setGoldenVisaOnly] = useState(false);

  const filtered = properties.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchComm = p.community?.toLowerCase().includes(q);
      const matchDev = p.developer?.toLowerCase().includes(q);
      if (!matchTitle && !matchComm && !matchDev) return false;
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
            Active portfolio synced directly to Balos WhatsApp AI
          </p>
        </div>

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

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, community, developer..."
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
            const coverImage = property.images?.[0]
              ? resolveMediaUrl(property.images[0])
              : null;

            return (
              <div
                key={property.id}
                className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col hover:border-creek/40 transition group"
              >
                {/* Photo Header */}
                <div className="relative h-48 bg-seaglass overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-soft">
                      <Building2 className="w-10 h-10" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${getStatusBadge(
                        property.status
                      )}`}
                    >
                      {property.status}
                    </span>
                  </div>

                  {/* Golden Visa Badge */}
                  {property.golden_visa_eligible && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-surface/90 backdrop-blur-xs text-creek text-[10px] font-bold shadow-xs flex items-center gap-1 border border-creek/20">
                      <ShieldCheck className="w-3 h-3 text-creek" />
                      Golden Visa
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-base font-bold font-heading text-creek">
                        {formatAED(property.price_aed)}
                      </span>
                      <span className="text-[10px] font-medium text-ink-muted uppercase">
                        {property.category} • {property.market_type?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-ink font-heading line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-1">
                      {property.community}
                      {property.sub_community ? `, ${property.sub_community}` : ''}
                      {property.developer ? ` • by ${property.developer}` : ''}
                    </p>
                  </div>

                  {/* Specs row */}
                  <div className="flex items-center gap-4 text-xs text-ink-muted pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-ink-soft" />
                      <span>{property.bedrooms} beds</span>
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

                  {/* Admin Edit Link */}
                  {isAdmin && (
                    <div className="pt-2">
                      <Link
                        href={`/properties/${property.id}/edit`}
                        className="w-full py-1.5 px-3 rounded-lg border border-border hover:bg-seaglass text-xs font-semibold text-ink flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit property
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

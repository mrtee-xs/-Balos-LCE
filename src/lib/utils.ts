import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency into UAE Dirhams (AED)
 * e.g. 25000000 -> AED 25,000,000
 */
export function formatAED(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'AED —';
  }
  return `AED ${new Intl.NumberFormat('en-AE', {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

/**
 * Compact AED formatting e.g. 1.45M, 500K
 */
export function formatCompactAED(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'AED —';
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `AED ${val % 1 === 0 ? val : val.toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `AED ${val % 1 === 0 ? val : val.toFixed(0)}K`;
  }
  return `AED ${amount}`;
}

/**
 * Converts any legacy Supabase dashboard preview URL or relative path into
 * a full public Storage URL for the property-media bucket.
 * 
 * Example legacy:
 * https://supabase.com/dashboard/project/xsiitikrcckzivadvact/storage/files/buckets/property-media?preview=Penthouse_tour.mp4
 * -> https://xsiitikrcckzivadvact.supabase.co/storage/v1/object/public/property-media/Penthouse_tour.mp4
 */
export function resolveMediaUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');

  // If it's a legacy URL with preview query parameter
  if (rawUrl.includes('property-media') && rawUrl.includes('preview=')) {
    try {
      const urlObj = new URL(rawUrl);
      const preview = urlObj.searchParams.get('preview');
      if (preview) {
        return `${supabaseUrl}/storage/v1/object/public/property-media/${encodeURIComponent(preview).replace(/%2F/g, '/')}`;
      }
    } catch {
      // Fallback regex if URL parsing fails
      const match = rawUrl.match(/[?&]preview=([^&]+)/);
      if (match && match[1]) {
        return `${supabaseUrl}/storage/v1/object/public/property-media/${match[1]}`;
      }
    }
  }

  // If it's already a full public URL, return as is
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }

  // If it's just the object path
  const cleanPath = rawUrl.replace(/^\/+/, '');
  return `${supabaseUrl}/storage/v1/object/public/property-media/${cleanPath}`;
}

/**
 * Constructs the canonical public URL for an uploaded file in property-media bucket.
 */
export function buildPublicMediaUrl(path: string): string {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${supabaseUrl}/storage/v1/object/public/property-media/${cleanPath}`;
}

/**
 * Brand config from environment
 */
export function getBrandConfig() {
  return {
    name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Balos Real Estate',
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '',
  };
}

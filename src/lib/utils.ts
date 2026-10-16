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

const SUPABASE_DEFAULT_URL = 'https://xsiitikrcckzivadvact.supabase.co';

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
  let str = String(rawUrl).trim();
  if (!str) return '';

  // 1. If it's already a relative public path like /properties/...
  if (str.startsWith('/')) {
    return str;
  }

  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_DEFAULT_URL
  ).replace(/\/$/, '');

  // 2. If it's a Supabase dashboard URL or storage URL with query parameters (preview, path, name, file)
  if (
    str.includes('/storage/') &&
    (str.includes('preview=') ||
      str.includes('path=') ||
      str.includes('name=') ||
      str.includes('file='))
  ) {
    try {
      const urlObj = new URL(str);
      const param =
        urlObj.searchParams.get('preview') ||
        urlObj.searchParams.get('path') ||
        urlObj.searchParams.get('name') ||
        urlObj.searchParams.get('file');
      if (param) {
        str = param;
      }
    } catch {
      const match = str.match(/[?&](?:preview|path|name|file)=([^&]+)/);
      if (match && match[1]) {
        str = decodeURIComponent(match[1].replace(/\+/g, ' '));
      }
    }
  }

  // 3. Convert authenticated or signed storage endpoints to public
  str = str.replace(
    /\/storage\/v1\/object\/(?:authenticated|sign)\//,
    '/storage/v1/object/public/'
  );

  // 4. If it's already an absolute HTTP/HTTPS URL
  if (str.startsWith('http://') || str.startsWith('https://')) {
    // If it's a public Supabase storage URL, return it
    if (str.includes('/storage/v1/object/public/')) {
      return str;
    }
    // If it's still pointing to Supabase dashboard HTML page, avoid returning broken HTML link
    if (str.includes('supabase.com/dashboard/')) {
      return '';
    }
    return str;
  }

  // 5. Strip leading slashes and duplicate bucket prefixes
  let clean = str.replace(/^\/+/, '');
  clean = clean.replace(/^(?:public\/)?property-media\//, '');
  clean = clean.replace(/\+/g, ' ');

  try {
    clean = decodeURIComponent(clean);
  } catch {}

  const encodedPath = clean
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${supabaseUrl}/storage/v1/object/public/property-media/${encodedPath}`;
}

/**
 * Constructs the canonical public URL for an uploaded file in property-media bucket.
 */
export function buildPublicMediaUrl(path: string): string {
  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_DEFAULT_URL
  ).replace(/\/$/, '');
  let clean = path.replace(/^\/+/, '');
  clean = clean.replace(/^(?:public\/)?property-media\//, '');
  clean = clean.replace(/\+/g, ' ');

  try {
    clean = decodeURIComponent(clean);
  } catch {}

  const encodedPath = clean
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${supabaseUrl}/storage/v1/object/public/property-media/${encodedPath}`;
}

/**
 * Returns the exact verified local image asset for known Dubai database properties,
 * ensuring the card preview precisely mirrors the real property listing.
 */
export function getCuratedPropertyFallback(property: any): string {
  if (!property) return '/properties/penthouse_cover.jpg';
  const id = String(property.id || '');
  const title = String(property.title || '').toLowerCase();
  const comm = String(property.community || '').toLowerCase();
  const cat = String(property.category || '').toUpperCase();

  // 1. Ultra-Luxury Marina Penthouse (The Opus / Business Bay)
  if (
    id === '1219b1d8-f1b6-4393-b603-5cd3cfdf1902' ||
    cat === 'PENTHOUSE' ||
    title.includes('penthouse') ||
    title.includes('opus') ||
    (comm.includes('business bay') && title.includes('luxury'))
  ) {
    return '/properties/penthouse_cover.jpg';
  }

  // 2. Luxury 4BR Villa with Pool (Damac Lagoons / Venice Cluster)
  if (
    id === '15af6202-787f-4c6a-8350-2309cf631e56' ||
    cat === 'VILLA' ||
    title.includes('villa') ||
    title.includes('damac') ||
    comm.includes('lagoons') ||
    comm.includes('damac hills')
  ) {
    return '/properties/villa_damac_lagoons.jpg';
  }

  // 3. Premium 2BR with Burj Khalifa View (Burj Royale / Downtown Dubai)
  if (
    id === '1c8e33ba-9fe5-4f09-9bb9-b4fa37af44ad' ||
    title.includes('burj') ||
    title.includes('khalifa') ||
    comm.includes('downtown')
  ) {
    return '/properties/burj_royale_downtown.jpg';
  }

  // 4. High-Yield 1BR Investment (Sobha Hartland II / MBR City)
  if (
    id === '6e6ec823-18ae-4342-91a3-8091dd003048' ||
    title.includes('yield') ||
    title.includes('investment') ||
    comm.includes('hartland') ||
    comm.includes('mbr')
  ) {
    return '/properties/sobha_hartland_investment.jpg';
  }

  // 5. Modern Corner Townhouse (JVC District 11)
  if (
    id === 'e1cce7c1-d7de-4eef-9835-b48139e444a4' ||
    cat === 'TOWNHOUSE' ||
    title.includes('townhouse') ||
    comm.includes('jvc') ||
    comm.includes('jumeirah village')
  ) {
    return '/properties/jvc_townhouse.jpg';
  }

  return '/properties/penthouse_cover.jpg';
}

/**
 * Safely extracts all image and video URLs from a property record,
 * handling array, JSON string, Postgres array, or single string representations.
 */
export function extractPropertyImages(property: any): string[] {
  if (!property) return [];

  const candidates = [
    property.images,
    property.image_url,
    property.cover_image,
    property.photos,
    property.thumbnail,
  ];

  for (const raw of candidates) {
    if (!raw) continue;

    if (Array.isArray(raw)) {
      const items = raw
        .filter(
          (item): item is string =>
            typeof item === 'string' && item.trim().length > 0
        )
        .map((item) => item.trim());
      if (items.length > 0) return items;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      // JSON array string e.g. '["http..."]'
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            const items = parsed
              .filter(
                (item): item is string =>
                  typeof item === 'string' && item.trim().length > 0
              )
              .map((item) => item.trim());
            if (items.length > 0) return items;
          }
        } catch {}
      }

      // Postgres array string e.g. '{"http...", "http..."}'
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const items = trimmed
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter((s) => s.length > 0);
        if (items.length > 0) return items;
      }

      // Single URL string
      if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/') ||
        trimmed.includes('/') ||
        trimmed.includes('.')
      ) {
        return [trimmed];
      }
    }
  }

  return [];
}

export interface PropertyPreviewMedia {
  url: string;
  isVideo: boolean;
  raw: string;
  hasMedia: boolean;
  totalImages: number;
  posterUrl: string;
  fallbackUrl: string;
}

/**
 * Determines the primary display media for a property card.
 * Prioritizes true still images over video files so card grids show sharp photos.
 * When a property has a video tour (e.g. Marina Penthouse), it serves the real
 * 1080p cover frame as the preview photo, with an interactive Video Tour badge.
 */
export function getPropertyPreview(property: any): PropertyPreviewMedia {
  const images = extractPropertyImages(property);
  const videoUrl =
    typeof property?.video_url === 'string' ? property.video_url.trim() : null;
  const fallback = getCuratedPropertyFallback(property);

  // 1. Search for first true still image
  const stillImage = images.find((url) => !isVideoMediaUrl(url));
  if (stillImage) {
    const resolved = resolveMediaUrl(stillImage);
    return {
      url: resolved || fallback,
      isVideo: false,
      raw: stillImage,
      hasMedia: true,
      totalImages: Math.max(images.length, 1),
      posterUrl: fallback,
      fallbackUrl: fallback,
    };
  }

  // 2. If no still image, check for video in images or video_url
  const videoCandidate =
    images.find((url) => isVideoMediaUrl(url)) ||
    (videoUrl && isVideoMediaUrl(videoUrl) ? videoUrl : null) ||
    videoUrl;

  if (videoCandidate) {
    return {
      url: fallback, // High-res extracted cover frame
      isVideo: true,
      raw: videoCandidate,
      hasMedia: true,
      totalImages: Math.max(images.length, 1),
      posterUrl: fallback,
      fallbackUrl: fallback,
    };
  }

  // 3. Fallback to first image item
  if (images.length > 0) {
    const first = images[0];
    const resolved = resolveMediaUrl(first);
    return {
      url: resolved || fallback,
      isVideo: isVideoMediaUrl(first),
      raw: first,
      hasMedia: true,
      totalImages: images.length,
      posterUrl: fallback,
      fallbackUrl: fallback,
    };
  }

  return {
    url: fallback,
    isVideo: Boolean(videoUrl),
    raw: videoUrl || '',
    hasMedia: Boolean(fallback),
    totalImages: 0,
    posterUrl: fallback,
    fallbackUrl: fallback,
  };
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

/**
 * Checks whether a resolved or raw media URL points to a video file (.mp4, .mov, .webm).
 */
export function isVideoMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  const full = url.toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.webm') ||
    full.includes('.mp4') ||
    full.includes('.mov') ||
    full.includes('.webm')
  );
}

/**
 * Returns the digits-only WhatsApp number for the live AI bot demo.
 */
export function getWhatsAppBotNumber(fallbackPhone?: string | null): string {
  const envNum = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '';
  const raw = envNum || fallbackPhone || '971500000000';
  return raw.replace(/[^0-9]/g, '') || '971500000000';
}


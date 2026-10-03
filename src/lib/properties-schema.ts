import { PropertyCategory, PropertyMarketType, PropertyStatus } from './types';

export interface ColumnDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'media-images' | 'media-video' | 'json';
  group: 'Core details' | 'Pricing & investment' | 'Specifications' | 'Compliance & verification' | 'Marketing & media';
  required?: boolean;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  helpText?: string;
  min?: number;
  step?: number;
}

export const PROPERTY_CATEGORY_OPTIONS: { value: PropertyCategory; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

export const PROPERTY_MARKET_TYPE_OPTIONS: { value: PropertyMarketType; label: string }[] = [
  { value: 'OFF_PLAN', label: 'Off-plan' },
  { value: 'READY_SECONDARY', label: 'Ready secondary' },
  { value: 'RENTAL', label: 'Rental' },
];

export const PROPERTY_STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available (Offered by AI)' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'HIDDEN', label: 'Hidden' },
];

/**
 * Introspected schema of public.properties columns from the database.
 */
export const PROPERTY_COLUMNS: ColumnDefinition[] = [
  // 1. Core details
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    group: 'Core details',
    required: true,
    placeholder: 'e.g. Ultra-Luxury Marina Penthouse',
  },
  {
    name: 'community',
    label: 'Community',
    type: 'text',
    group: 'Core details',
    required: true,
    placeholder: 'e.g. Business Bay, Downtown Dubai',
  },
  {
    name: 'sub_community',
    label: 'Sub-community',
    type: 'text',
    group: 'Core details',
    required: false,
    placeholder: 'e.g. Executive Towers',
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    group: 'Core details',
    required: true,
    options: PROPERTY_CATEGORY_OPTIONS,
  },
  {
    name: 'market_type',
    label: 'Market type',
    type: 'select',
    group: 'Core details',
    required: true,
    options: PROPERTY_MARKET_TYPE_OPTIONS,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    group: 'Core details',
    required: true,
    options: PROPERTY_STATUS_OPTIONS,
    helpText: 'The AI WhatsApp engine only presents properties marked as Available.',
  },

  // 2. Pricing & investment
  {
    name: 'price_aed',
    label: 'Price (AED)',
    type: 'number',
    group: 'Pricing & investment',
    required: true,
    min: 0,
    step: 1000,
    placeholder: 'e.g. 2500000',
    helpText: 'Properties priced at AED 2,000,000 or above automatically qualify for the UAE Golden Visa.',
  },
  {
    name: 'service_charge_aed_sqft',
    label: 'Service charge (AED/sq ft)',
    type: 'number',
    group: 'Pricing & investment',
    min: 0,
    step: 0.1,
    placeholder: 'e.g. 22.5',
  },
  {
    name: 'projected_roi',
    label: 'Projected ROI (%)',
    type: 'number',
    group: 'Pricing & investment',
    min: 0,
    step: 0.1,
    placeholder: 'e.g. 8.5',
  },
  {
    name: 'payment_plan',
    label: 'Payment plan',
    type: 'text',
    group: 'Pricing & investment',
    placeholder: 'e.g. 60/40 payment plan (20% on booking, 40% during construction, 40% on handover)',
  },

  // 3. Specifications
  {
    name: 'bedrooms',
    label: 'Bedrooms',
    type: 'number',
    group: 'Specifications',
    required: true,
    min: 0,
    step: 1,
    placeholder: 'e.g. 2',
  },
  {
    name: 'bathrooms',
    label: 'Bathrooms',
    type: 'number',
    group: 'Specifications',
    min: 0,
    step: 0.5,
    placeholder: 'e.g. 3',
  },
  {
    name: 'size_sqft',
    label: 'Size (sq ft)',
    type: 'number',
    group: 'Specifications',
    min: 0,
    step: 1,
    placeholder: 'e.g. 1850',
  },
  {
    name: 'handover_date',
    label: 'Handover date',
    type: 'text',
    group: 'Specifications',
    placeholder: 'e.g. Ready or Q4 2026',
  },
  {
    name: 'developer',
    label: 'Developer',
    type: 'text',
    group: 'Specifications',
    placeholder: 'e.g. Emaar, Omniyat, DAMAC',
  },
  {
    name: 'project_name',
    label: 'Project name',
    type: 'text',
    group: 'Specifications',
    placeholder: 'e.g. The Opus, Burj Crown',
  },

  // 4. Compliance & verification
  {
    name: 'trakheesi_permit_no',
    label: 'Trakheesi permit number',
    type: 'text',
    group: 'Compliance & verification',
    placeholder: 'e.g. 7184920371',
    helpText: 'Official Dubai Land Department / RERA advertising permit.',
  },
  {
    name: 'golden_visa_eligible',
    label: 'Golden visa eligible',
    type: 'boolean',
    group: 'Compliance & verification',
    readOnly: true,
    helpText: 'Automatically computed: true when Price >= 2,000,000 AED.',
  },

  // 5. Marketing & media
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    group: 'Marketing & media',
    placeholder: 'Highlight views, finishes, layout, amenities, and key selling points...',
  },
  {
    name: 'brochure_url',
    label: 'Brochure URL',
    type: 'text',
    group: 'Marketing & media',
    placeholder: 'https://...',
  },
  {
    name: 'images',
    label: 'Images',
    type: 'media-images',
    group: 'Marketing & media',
    helpText: 'Upload, delete, and drag to reorder. The first image is the cover sent on WhatsApp.',
  },
  {
    name: 'video_url',
    label: 'Video tour',
    type: 'media-video',
    group: 'Marketing & media',
    helpText: 'One video tour. WhatsApp handles videos under 16 MB best. Maximum 50 MB.',
  },
];

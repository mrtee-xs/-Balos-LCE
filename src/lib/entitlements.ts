import { SubscriptionTier } from './types';

export interface TierCapabilities {
  tier: SubscriptionTier;
  name: string;
  monthlyPriceAED: number;
  yearlyPriceAED: number;
  monthlyConversationLimit: number;
  maxWhatsappLines: number;
  unlimitedAgentSeats: true; // Explicit mandate: unlimited seats on all plans
  canHumanTakeover: boolean; // Growth+
  canAiCopilot: boolean; // Growth+
  canGoldenVisaScreening: boolean; // Growth+
  canPortalRoiAttribution: boolean; // Growth+
  canMediaDispatch: boolean; // Growth+
  canCrmSync: boolean; // Scale+ (FUB, HubSpot, GHL, Zoho)
  canSalesforce: boolean; // Enterprise
  canRemoteMcp: boolean; // Scale+
  canLeadershipRoles: boolean; // Scale+ (sales_leader, team_leader)
  canWeeklyDigest: boolean; // Scale+
}

export const TIER_CONFIG: Record<SubscriptionTier, TierCapabilities> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    monthlyPriceAED: 1999,
    yearlyPriceAED: 1665,
    monthlyConversationLimit: 500,
    maxWhatsappLines: 1,
    unlimitedAgentSeats: true,
    canHumanTakeover: false,
    canAiCopilot: false,
    canGoldenVisaScreening: false,
    canPortalRoiAttribution: false,
    canMediaDispatch: false,
    canCrmSync: false,
    canSalesforce: false,
    canRemoteMcp: false,
    canLeadershipRoles: false,
    canWeeklyDigest: false,
  },
  growth: {
    tier: 'growth',
    name: 'Growth (Core)',
    monthlyPriceAED: 4999,
    yearlyPriceAED: 4165,
    monthlyConversationLimit: 2000,
    maxWhatsappLines: 1,
    unlimitedAgentSeats: true,
    canHumanTakeover: true,
    canAiCopilot: true,
    canGoldenVisaScreening: true,
    canPortalRoiAttribution: true,
    canMediaDispatch: true,
    canCrmSync: false,
    canSalesforce: false,
    canRemoteMcp: false,
    canLeadershipRoles: false,
    canWeeklyDigest: false,
  },
  scale: {
    tier: 'scale',
    name: 'Scale',
    monthlyPriceAED: 9999,
    yearlyPriceAED: 8330,
    monthlyConversationLimit: 6000,
    maxWhatsappLines: 3,
    unlimitedAgentSeats: true,
    canHumanTakeover: true,
    canAiCopilot: true,
    canGoldenVisaScreening: true,
    canPortalRoiAttribution: true,
    canMediaDispatch: true,
    canCrmSync: true,
    canSalesforce: false,
    canRemoteMcp: true,
    canLeadershipRoles: true,
    canWeeklyDigest: true,
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    monthlyPriceAED: 19999,
    yearlyPriceAED: 16665,
    monthlyConversationLimit: 999999,
    maxWhatsappLines: 10,
    unlimitedAgentSeats: true,
    canHumanTakeover: true,
    canAiCopilot: true,
    canGoldenVisaScreening: true,
    canPortalRoiAttribution: true,
    canMediaDispatch: true,
    canCrmSync: true,
    canSalesforce: true,
    canRemoteMcp: true,
    canLeadershipRoles: true,
    canWeeklyDigest: true,
  },
};

/**
 * Normalizes any string to a valid SubscriptionTier.
 * Defaults to 'starter' if unrecognized or empty.
 */
export function normalizeSubscriptionTier(
  tier?: string | null
): SubscriptionTier {
  if (!tier) return 'starter';
  const lower = tier.toLowerCase().trim();
  if (lower === 'enterprise') return 'enterprise';
  if (lower === 'scale') return 'scale';
  if (lower === 'growth') return 'growth';
  return 'starter';
}

/**
 * Returns full capabilities object for a given tier.
 */
export function getTierCapabilities(tier?: string | null): TierCapabilities {
  const normalized = normalizeSubscriptionTier(tier);
  return TIER_CONFIG[normalized];
}

/**
 * Checks whether a given tier is allowed to use a particular capability.
 */
export function checkFeatureAccess(
  tier: string | null | undefined,
  feature: keyof Omit<
    TierCapabilities,
    'tier' | 'name' | 'monthlyPriceAED' | 'yearlyPriceAED' | 'monthlyConversationLimit' | 'maxWhatsappLines'
  >
): boolean {
  const caps = getTierCapabilities(tier);
  return Boolean(caps[feature]);
}

/**
 * Returns the minimum required tier for a given feature.
 */
export function getRequiredTierForFeature(feature: keyof TierCapabilities): SubscriptionTier {
  if (feature === 'canSalesforce') return 'enterprise';
  if (
    feature === 'canCrmSync' ||
    feature === 'canRemoteMcp' ||
    feature === 'canLeadershipRoles' ||
    feature === 'canWeeklyDigest'
  ) {
    return 'scale';
  }
  if (
    feature === 'canHumanTakeover' ||
    feature === 'canAiCopilot' ||
    feature === 'canGoldenVisaScreening' ||
    feature === 'canPortalRoiAttribution' ||
    feature === 'canMediaDispatch'
  ) {
    return 'growth';
  }
  return 'starter';
}

/**
 * Checks if the monthly conversation limit has been reached.
 */
export function isConversationQuotaExceeded(
  usedThisMonth: number,
  limit: number
): boolean {
  if (limit >= 999999) return false; // Enterprise unlimited
  return usedThisMonth >= limit;
}

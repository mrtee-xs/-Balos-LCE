import assert from 'node:assert';
import {
  normalizeSubscriptionTier,
  getTierCapabilities,
  checkFeatureAccess,
  getRequiredTierForFeature,
  isConversationQuotaExceeded,
  TIER_CONFIG,
} from '../src/lib/entitlements.js';

console.log('--- Testing Balos Tier Entitlements & Policy Rules ---');

// 1. Verify Normalization
assert.strictEqual(normalizeSubscriptionTier('starter'), 'starter');
assert.strictEqual(normalizeSubscriptionTier('GROWTH'), 'growth');
assert.strictEqual(normalizeSubscriptionTier('Scale'), 'scale');
assert.strictEqual(normalizeSubscriptionTier('enterprise'), 'enterprise');
assert.strictEqual(normalizeSubscriptionTier(undefined), 'starter');
assert.strictEqual(normalizeSubscriptionTier('invalid_tier'), 'starter');
console.log('✓ normalizeSubscriptionTier passed');

// 2. Mandate Verification: UNLIMITED AGENT SEATS ACROSS ALL TIERS
for (const tier of ['starter', 'growth', 'scale', 'enterprise']) {
  const caps = getTierCapabilities(tier);
  assert.strictEqual(
    caps.unlimitedAgentSeats,
    true,
    `Tier ${tier} MUST offer unlimited agent seats with zero seat fees!`
  );
}
console.log('✓ Unlimited agent seats mandate verified on all 4 tiers');

// 3. Conversation Quota Verification
assert.strictEqual(TIER_CONFIG.starter.monthlyConversationLimit, 500);
assert.strictEqual(TIER_CONFIG.growth.monthlyConversationLimit, 2000);
assert.strictEqual(TIER_CONFIG.scale.monthlyConversationLimit, 6000);
assert.strictEqual(TIER_CONFIG.enterprise.monthlyConversationLimit, 999999);
console.log('✓ Tier conversation limits verified (500, 2000, 6000, pooled)');

// 4. WhatsApp Line Quotas
assert.strictEqual(TIER_CONFIG.starter.maxWhatsappLines, 1);
assert.strictEqual(TIER_CONFIG.growth.maxWhatsappLines, 1);
assert.strictEqual(TIER_CONFIG.scale.maxWhatsappLines, 3);
assert.strictEqual(TIER_CONFIG.enterprise.maxWhatsappLines, 10);
console.log('✓ WhatsApp inbound line quotas verified (1, 1, 3, 10)');

// 5. Feature Gate Verification for Starter
assert.strictEqual(checkFeatureAccess('starter', 'canHumanTakeover'), false);
assert.strictEqual(checkFeatureAccess('starter', 'canAiCopilot'), false);
assert.strictEqual(checkFeatureAccess('starter', 'canGoldenVisaScreening'), false);
assert.strictEqual(checkFeatureAccess('starter', 'canPortalRoiAttribution'), false);
assert.strictEqual(checkFeatureAccess('starter', 'canMediaDispatch'), false);
assert.strictEqual(checkFeatureAccess('starter', 'canCrmSync'), false);
assert.strictEqual(checkFeatureAccess('starter', 'canRemoteMcp'), false);
assert.strictEqual(checkFeatureAccess('starter', 'canLeadershipRoles'), false);
console.log('✓ Starter feature locks strictly enforced');

// 6. Feature Gate Verification for Growth
assert.strictEqual(checkFeatureAccess('growth', 'canHumanTakeover'), true);
assert.strictEqual(checkFeatureAccess('growth', 'canAiCopilot'), true);
assert.strictEqual(checkFeatureAccess('growth', 'canGoldenVisaScreening'), true);
assert.strictEqual(checkFeatureAccess('growth', 'canPortalRoiAttribution'), true);
assert.strictEqual(checkFeatureAccess('growth', 'canMediaDispatch'), true);
assert.strictEqual(checkFeatureAccess('growth', 'canCrmSync'), false);
assert.strictEqual(checkFeatureAccess('growth', 'canRemoteMcp'), false);
assert.strictEqual(checkFeatureAccess('growth', 'canLeadershipRoles'), false);
console.log('✓ Growth tier unlocks verified (takeover, copilot, visa, portal ROI, media)');

// 7. Feature Gate Verification for Scale
assert.strictEqual(checkFeatureAccess('scale', 'canHumanTakeover'), true);
assert.strictEqual(checkFeatureAccess('scale', 'canAiCopilot'), true);
assert.strictEqual(checkFeatureAccess('scale', 'canCrmSync'), true);
assert.strictEqual(checkFeatureAccess('scale', 'canRemoteMcp'), true);
assert.strictEqual(checkFeatureAccess('scale', 'canLeadershipRoles'), true);
assert.strictEqual(checkFeatureAccess('scale', 'canWeeklyDigest'), true);
assert.strictEqual(checkFeatureAccess('scale', 'canSalesforce'), false);
console.log('✓ Scale tier unlocks verified (CRM hub, MCP, leadership roles, weekly digest)');

// 8. Feature Gate Verification for Enterprise
assert.strictEqual(checkFeatureAccess('enterprise', 'canSalesforce'), true);
assert.strictEqual(checkFeatureAccess('enterprise', 'canRemoteMcp'), true);
assert.strictEqual(checkFeatureAccess('enterprise', 'canCrmSync'), true);
console.log('✓ Enterprise unlocks verified (Salesforce, custom ERP, pooled lines)');

// 9. Required Tier Mapping
assert.strictEqual(getRequiredTierForFeature('canHumanTakeover'), 'growth');
assert.strictEqual(getRequiredTierForFeature('canAiCopilot'), 'growth');
assert.strictEqual(getRequiredTierForFeature('canCrmSync'), 'scale');
assert.strictEqual(getRequiredTierForFeature('canRemoteMcp'), 'scale');
assert.strictEqual(getRequiredTierForFeature('canSalesforce'), 'enterprise');
console.log('✓ getRequiredTierForFeature mappings verified');

// 10. Quota Calculation
assert.strictEqual(isConversationQuotaExceeded(499, 500), false);
assert.strictEqual(isConversationQuotaExceeded(500, 500), true);
assert.strictEqual(isConversationQuotaExceeded(550, 500), true);
assert.strictEqual(isConversationQuotaExceeded(15000, 999999), false);
console.log('✓ isConversationQuotaExceeded assertions verified');

console.log('\nAll 10/10 Tier Entitlement and Gating tests PASSED successfully!');

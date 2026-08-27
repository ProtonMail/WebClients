import type { FeatureFlag } from '@proton/unleash/Flags';

import type { ADDON_NAMES, ADDON_PREFIXES, PLANS } from '../constants';
import type { FeatureLimitKey, FreeSubscription, PlanIDs } from '../interface';
import type { Subscription } from '../subscription/interface';

/** Coupon flags that can hide an addon customizer. Defined in core; CouponConfig references it. */
export type CouponHideFlag = 'hideLumoAddonBanner' | 'hideMeetAddonBanner';

export type AddonVisibilityFlag = Extract<FeatureFlag, 'DomainVpnBiz2023'>;

export interface AddonCustomizerContext {
    subscription: Subscription | FreeSubscription;
    planIDs: PlanIDs;
    /** Resolved by the caller from the addon's declared coupon flag (ui type stays out of core). */
    bannerHiddenByCoupon: boolean;
    /** Resolved by the dispatcher from the addon's declared `visibility.featureFlag` (false if none/unset). */
    featureFlagEnabled: boolean;
    /** True when rendered in a signup flow (some addons hide at signup). */
    isSignup: boolean;
}

/** One condition in an addon's visibility checklist. The customizer shows only when all pass. */
export type AddonVisibilityRule = (ctx: AddonCustomizerContext) => boolean;

/**
 * How an addon contributes to feature limits.
 * `native`: the limit is reported on the plan by the API (member, domain).
 * `synthetic`: the addon fabricates a limit the API doesn't return (ip, scribe, lumo, meet).
 */
export type AddonFeatureLimit =
    | { kind: 'native'; key: 'MaxMembers' | 'MaxDomains' }
    | {
          kind: 'synthetic';
          key: FeatureLimitKey;
          grants: Partial<Record<FeatureLimitKey, number>>;
          /** Addons sharing a group draw from one member-capped seat pool; `preferred` wins when trimming. */
          pool?: { group: string; preferred?: boolean };
      };

/** Named strategy resolved by `switchPlan`; configs must not depend on its implementation. */
export type AddonTransferStrategy = 'member' | 'domain' | 'scribe' | 'lumo' | 'meet' | 'subtract-included';

/**
 * The single declarative definition of an addon — the unit of the addon SDK.
 *
 * One `AddonConfig` per addon type lives in `./configs/*.ts` and is registered in
 * `getAllAddonConfigs()` ([./addons.ts]). Registering a config automatically drives plan-by-plan
 * assembly, display order, the name→feature-key map, synthetic plan limits, member-cap/seat-pool
 * balancing, tooltips, and checkout titles — no per-type code elsewhere.
 *
 * Field groups:
 * - Identity:     `addonType` (plans it's sold on are derived from the addon-name convention)
 * - Offering:     `alwaysOffered` (member/ip) vs. gated by its `addonFlags` entry
 * - Feature limit:`featureLimit` (`native` reported by API | `synthetic` fabricated via `grants`,
 *                 optionally drawing from a member-capped seat `pool`)
 * - Capping:      `isPerMemberCapped`, `featureLimit.pool.preferred` (type kept when trimming a shared pool)
 * - Customizer:   `syncWithMembersAddon`, `min`/`max`/`minTrial`/`maxTrial`
 * - Presentation: `title`, `tooltipLabel`, `addonCheckoutTitle`, `*BlockedReasonText`
 * - Ordering:     `displayOrder` (lower renders first)
 */
export interface AddonConfig {
    addonType: ADDON_PREFIXES;
    addonCheckoutTitle: (seats: number, options: { planIDs: PlanIDs }) => string;
    min?: AddonNumberConfig;
    max?: AddonNumberConfig;
    title: (...args: any | any[]) => string;
    /** Title shown in the dashboard "current plan" addon list. Return '' for addons with no dashboard line. */
    dashboardTitle: (quantity: number, maxMembers: number, scribeToLumo: boolean) => string;
    isPerMemberCapped: boolean;
    /** Lower renders first. Single source of truth for addon order. */
    displayOrder: number;
    /** When true, always offered (member/ip). Otherwise offered only when its addonFlags entry is on. */
    alwaysOffered?: boolean;
    featureLimit: AddonFeatureLimit;
    /** How quantity carries across plan switches (`switchPlan`). */
    transferStrategy: AddonTransferStrategy;
    /**
     * Capacity a base plan bundles in for this feature, when the API doesn't report it (VPN_BUSINESS
     * includes 1 IP). Expanded through `featureLimit.grants`.
     */
    includedByPlanOverride?: Partial<Record<PLANS, number>>;
    /** Copy for the generic NumberCustomiser control. Set for addons rendered generically (member, domain). */
    customizerCopy?: AddonCustomizerCopy;
    tooltipLabel?: (price: string) => string;
    syncWithMembersAddon?: 'when-equal' | 'always';
    minTrial?: AddonNumberConfig;
    maxTrial?: AddonNumberConfig;
    increaseBlockedReasonText?: (...args: any | any[]) => string;
    trialIncreaseBlockedReasonText?: (...args: any | any[]) => string;
    decreaseBlockedReasonText?: (...args: any | any[]) => string;
    /** How the customizer's visibility is gated. Evaluated by the `showAddonCustomizer` dispatcher. */
    visibility?: AddonVisibility;
}

/** An addon's visibility gating — pure data; the ui dispatcher resolves the dynamic inputs and runs `rules`. */
export interface AddonVisibility {
    /** Declarative checklist — the customizer shows only when every rule passes. */
    rules?: AddonVisibilityRule[];
    /** Coupon flag the dispatcher resolves into `AddonCustomizerContext.bannerHiddenByCoupon`. */
    couponHideFlag?: CouponHideFlag;
    /** Feature flag the dispatcher resolves into `AddonCustomizerContext.featureFlagEnabled`. */
    featureFlag?: AddonVisibilityFlag;
}

export interface AddonNumberConfig {
    perOrganization?: number;
    perMember?: number;
}

/** Custom transfer handlers whose billing logic lives explicitly in `planIDs.ts`. */

export type AddonFlags = Partial<Record<ADDON_PREFIXES, boolean>>;

/**
 * Runtime context passed to `AddonCustomizerCopy` functions. `addonName` lets a config resolve
 * copy sub-variants it can't infer from `addonType` alone (member has three).
 */
export interface CustomizerCopyContext {
    addonName: ADDON_NAMES;
    memberCount: number;
    showUsersTooltip?: boolean;
}

/** Copy for the generic NumberCustomiser control (member, domain). */
export interface AddonCustomizerCopy {
    label: (ctx: CustomizerCopyContext) => string;
    tooltip?: (ctx: CustomizerCopyContext) => string | undefined;
}

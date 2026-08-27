import { getAddonConfigByType } from '@proton/payments/core/addon/addons';
import type { ADDON_PREFIXES } from '@proton/payments/core/constants';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import type { FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';

/**
 * Whether an addon's customizer should be shown in checkout. The decision lives in the addon config's
 * `customizerVisibilityRules`; this only bridges the ui-typed `couponConfig` into a plain boolean (core
 * can't import ui) and evaluates the checklist.
 */
export function showAddonCustomizer(
    addonType: ADDON_PREFIXES,
    {
        subscription,
        couponConfig,
        planIDs,
        isSignup = false,
    }: {
        subscription: Subscription | FreeSubscription;
        couponConfig: CouponConfigMetadata | undefined;
        planIDs: PlanIDs;
        isSignup?: boolean;
    }
): boolean {
    const visibility = getAddonConfigByType(addonType)?.visibility;
    if (!visibility?.rules?.length) {
        return false;
    }
    const { rules, couponHideFlag, featureFlag } = visibility;

    const bannerHiddenByCoupon = couponHideFlag ? !!couponConfig?.[couponHideFlag] : false;
    const featureFlagEnabled = featureFlag ? (getStandaloneUnleashClient()?.isEnabled(featureFlag) ?? false) : false;
    const ctx = { subscription, planIDs, bannerHiddenByCoupon, featureFlagEnabled, isSignup };

    return rules.every((rule) => rule(ctx));
}

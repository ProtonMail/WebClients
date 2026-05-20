import { isBF2025Offer } from '@proton/payments/core/checkout';
import { getAddonNameByPlan, getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import { hasNoExternallyManagedLumoSubscription } from '@proton/payments/core/subscription/helpers';
import {
    ADDON_PREFIXES,
    type CYCLE,
    type FreeSubscription,
    PLANS,
    type PlanIDs,
    type Subscription,
    hasLumoAddonFromPlanIDs,
} from '@proton/payments/index';

import type { CouponConfig } from '../../coupon-config/interface';
import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';

export function showLumoAddonCustomizer({
    subscription,
    couponConfig,
    initialCoupon,
    planIDs,
    cycle,
    hideLumoAddonForVpn2024 = false,
}: {
    subscription: Subscription | FreeSubscription;
    couponConfig: CouponConfigRendered | CouponConfig | undefined;
    initialCoupon: string | undefined | null;
    planIDs: PlanIDs;
    cycle: CYCLE;
    hideLumoAddonForVpn2024?: boolean;
}): boolean {
    const userSelectedLumoAddon = hasLumoAddonFromPlanIDs(planIDs);

    const selectedPlanName = getPlanNameFromIDs(planIDs);
    const selectedPlanSupportsLumoAddon =
        !!selectedPlanName && !!getAddonNameByPlan(ADDON_PREFIXES.LUMO, selectedPlanName);

    return (
        selectedPlanSupportsLumoAddon &&
        hasNoExternallyManagedLumoSubscription(subscription) &&
        // Experimentally hide lumo addon banner for those who wants to buy to vpn2024
        (!hideLumoAddonForVpn2024 || !planIDs[PLANS.VPN2024] || userSelectedLumoAddon) &&
        // Hides the Lumo Banner if certain coupon config requested to disable it or if we currently have a BF campaign.
        // todo: isBF2025Offer check should be replaced by passing static CouponConfig object to
        // showLumoAddonCustomizer().
        ((!couponConfig?.hideLumoAddonBanner && !isBF2025Offer({ coupon: initialCoupon, planIDs, cycle })) ||
            // if user already has lumo addon and it was transferred to the new selected plan then display the lumo addon
            // customizer
            userSelectedLumoAddon)
    );
}

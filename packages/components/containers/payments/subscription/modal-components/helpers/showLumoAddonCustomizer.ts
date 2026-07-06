import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import type { FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { hasLumoAddonFromPlanIDs } from '@proton/payments/core/plan/addons';
import { getAddonNameByPlan, getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import { hasNoExternallyManagedLumoSubscription } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { CouponConfig } from '@proton/payments/ui/coupon-config/interface';
import type { CouponConfigRendered } from '@proton/payments/ui/coupon-config/useCouponConfig';

export function showLumoAddonCustomizer({
    subscription,
    couponConfig,
    planIDs,
}: {
    subscription: Subscription | FreeSubscription;
    couponConfig: CouponConfigRendered | CouponConfig | undefined;
    planIDs: PlanIDs;
}): boolean {
    const userSelectedLumoAddon = hasLumoAddonFromPlanIDs(planIDs);

    const selectedPlanName = getPlanNameFromIDs(planIDs);
    const selectedPlanSupportsLumoAddon =
        !!selectedPlanName && !!getAddonNameByPlan(ADDON_PREFIXES.LUMO, selectedPlanName);

    return (
        selectedPlanSupportsLumoAddon &&
        hasNoExternallyManagedLumoSubscription(subscription) &&
        // Hides the Lumo Banner if certain coupon config requested to disable it or if we currently have a BF campaign.
        (!couponConfig?.hideLumoAddonBanner ||
            // if user already has lumo addon and it was transfered to the new selected plan then display the lumo addon
            // customizer
            userSelectedLumoAddon)
    );
}

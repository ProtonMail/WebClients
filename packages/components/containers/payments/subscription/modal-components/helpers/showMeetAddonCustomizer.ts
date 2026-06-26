import { getAddonNameByPlan } from '@proton/payments/core/plan/helpers';
import { ADDON_PREFIXES, type PlanIDs, getPlanNameFromIDs, hasMeetAddonFromPlanIDs } from '@proton/payments/index';
import type { CouponConfig } from '@proton/payments/ui/coupon-config/interface';
import type { CouponConfigRendered } from '@proton/payments/ui/coupon-config/useCouponConfig';

export function showMeetAddonCustomizer({
    couponConfig,
    planIDs,
}: {
    couponConfig: CouponConfigRendered | CouponConfig | undefined;
    planIDs: PlanIDs;
}): boolean {
    const userSelectedMeetAddon = hasMeetAddonFromPlanIDs(planIDs);

    const selectedPlanName = getPlanNameFromIDs(planIDs);
    const selectedPlanSupportsMeetAddon =
        !!selectedPlanName && !!getAddonNameByPlan(ADDON_PREFIXES.MEET, selectedPlanName);

    return (
        selectedPlanSupportsMeetAddon &&
        // If the matched coupon config requests to hide the meet addon customizer then we hide it, unless the user has
        // already selected the meet addon. This can happen when user already has a current subscription with meet addon
        // - in that case we need to show the customizer so user could opt out of meet addon if they want to.
        (!couponConfig?.hideMeetAddonBanner || userSelectedMeetAddon)
    );
}

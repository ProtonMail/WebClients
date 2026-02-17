import { isBF2025Offer } from '@proton/payments/core/checkout';
import { canAddLumoAddon } from '@proton/payments/core/subscription/helpers';
import {
    type CYCLE,
    type FreeSubscription,
    type PlanIDs,
    type Subscription,
    hasLumoAddonFromPlanIDs,
} from '@proton/payments/index';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';

export function showLumoAddonCustomizer({
    subscription,
    couponConfig,
    initialCoupon,
    planIDs,
    cycle,
}: {
    subscription: Subscription | FreeSubscription;
    couponConfig: CouponConfigRendered | undefined;
    initialCoupon: string | undefined | null;
    planIDs: PlanIDs;
    cycle: CYCLE;
}): boolean {
    return (
        canAddLumoAddon(subscription) &&
        ((!couponConfig?.hideLumoAddonBanner &&
            // Hides the Lumo Banner during loading
            !isBF2025Offer({ coupon: initialCoupon, planIDs, cycle })) ||
            // if user already has lumo addon and it was transfered to the new selected plan then display the lumo addon
            // customizer
            hasLumoAddonFromPlanIDs(planIDs))
    );
}

import type { PaymentsCheckout } from '@proton/payments/index';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';

export function checkoutGetTotalAmount(
    checkout: PaymentsCheckout,
    trial: boolean,
    couponConfig: CouponConfigRendered | undefined
) {
    const { checkResult, withDiscountPerCycle } = checkout;
    if (checkResult.Amount === 0 && trial) {
        // the fallback should technically never be used, but in case if BaseRenewAmount is still somehow null while
        // trial is selected, then we will use the full optimistic amount
        return checkResult.BaseRenewAmount ?? checkout.regularAmountPerCycleOptimistic;
    }

    if (couponConfig?.hidden) {
        return withDiscountPerCycle;
    }

    return checkResult.Amount;
}

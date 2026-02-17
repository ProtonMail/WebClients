import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';

export function checkoutGetNetTotalAmount(
    checkout: PaymentsCheckoutUI,
    trial: boolean,
    couponConfig: CouponConfigRendered | undefined
) {
    const { checkResult, withDiscountPerCycle } = checkout;
    if (checkResult.Amount === 0 && trial) {
        // old comment: the fallback should technically never be used, but in case if BaseRenewAmount is still somehow
        // null while trial is selected, then we will use the full optimistic amount
        //
        // new comment: the commented code below is what we had previously, but after tax exclusive was introduced,
        // trial-to-trial modifications could display wrong net total amount, because checkResult.BaseRenewAmount
        // already includes taxes, so it's actually net total + VAT on top. So we reverted back to optimistic
        // computation.
        //
        // return checkResult.BaseRenewAmount ?? checkout.regularAmountPerCycleOptimistic;
        return checkout.regularAmountPerCycleOptimistic;
    }

    if (couponConfig?.hidden) {
        return withDiscountPerCycle;
    }

    return checkResult.Amount;
}

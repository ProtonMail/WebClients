import Price from '@proton/components/components/price/Price';
import { CYCLE } from '@proton/payments';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { COUPON_CODES } from '@proton/payments/core/constants';

import type { CouponConfig } from './interface';

export const monthlyNudgeConfig: CouponConfig = {
    coupons: [COUPON_CODES.ANNUALOFFER25],
    hidden: true,
    cyclePriceCompare: ({ cycle, suffix }, config) => {
        if (cycle !== CYCLE.YEARLY) {
            return null;
        }

        const checkout = getCheckoutUi(config);

        return (
            <Price className="ml-2 text-strike" currency={checkout.currency} suffix={suffix}>
                {checkout.withoutDiscountPerMonth}
            </Price>
        );
    },
    cycleTitle: undefined,
};

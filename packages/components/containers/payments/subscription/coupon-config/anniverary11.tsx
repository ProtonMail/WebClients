import Price from '@proton/components/components/price/Price';
import { COUPON_CODES, CYCLE } from '@proton/payments';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';

import { type CouponConfig } from './interface';

export const anniversary11Config: CouponConfig = {
    coupons: [COUPON_CODES.PROTONBDAYSALE25, COUPON_CODES.PROTONBDAYSALEB25, COUPON_CODES.COMMUNITYSPECIALDEAL25],
    hidden: true,
    cyclePriceCompare: ({ cycle, suffix }, config) => {
        if (cycle !== CYCLE.YEARLY) {
            return null;
        }

        const checkout = getCheckout(config);

        return (
            <Price className="ml-2 text-strike" currency={checkout.currency} suffix={suffix}>
                {checkout.withoutDiscountPerMonth}
            </Price>
        );
    },
    availableCycles: [CYCLE.YEARLY],
};

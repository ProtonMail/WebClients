import Price from '@proton/components/components/price/Price';
import { COUPON_CODES, CYCLE, getCheckout } from '@proton/payments';

import { type CouponConfig } from './interface';

export const tldrNewsletterConfig: CouponConfig = {
    coupons: [COUPON_CODES.TLDRPROMO072025],
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

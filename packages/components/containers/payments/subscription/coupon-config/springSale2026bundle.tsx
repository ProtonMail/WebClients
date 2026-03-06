import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';

import type { CouponConfig } from './interface';

export const springSale2026BundleConfig: CouponConfig = {
    coupons: [COUPON_CODES.MAR26BUNDLESALE],
    checkoutSubtitle: () => c('Title').t`Spring Sale`,
    payCTA: () => c('Label').t`Get the deal`,
    hidden: true,
    cyclePriceComparePosition: 'before',
    cyclePriceCompare: ({ suffix }, config) => {
        const checkout = getCheckoutUi(config);

        return (
            <Price className="mr-2 text-strike" currency={checkout.currency} suffix={suffix}>
                {checkout.withoutDiscountPerMonth}
            </Price>
        );
    },
    availableCycles: [CYCLE.YEARLY],
    disableCurrencySelector: true,
    // Different from non-bundle config
    hideLumoAddonBanner: false,
};

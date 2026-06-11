import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import { getPlanFromPlanIDs } from '@proton/payments/core/plan/helpers';

import { getShortBillingText } from '../helpers';
import type { CouponConfig } from './interface';

export const summerSale2026BundleConfig: CouponConfig = {
    coupons: [COUPON_CODES.JUNE26BUNDLESALE, COUPON_CODES.MAR26BUNDLESALECS],
    checkoutSubtitle: () => c('Title').t`Summer Sale`,
    payCTA: () => c('Action').t`Get the deal`,
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
    cycleTitle: ({ cycle }, config) => {
        const plan = getPlanFromPlanIDs(config.plansMap, config.planIDs);
        const planTitle = plan?.Title;
        if (!planTitle) {
            return undefined; // falls back to the default cycle title
        }

        return `${planTitle} ${getShortBillingText(cycle, config.planIDs)}`;
    },
    availableCycles: [CYCLE.YEARLY],
    disableCurrencySelector: true,
    hideLumoAddonBanner: true,
    hideMeetAddonBanner: true,
};

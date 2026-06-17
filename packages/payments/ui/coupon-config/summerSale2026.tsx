import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { getShortBillingText } from '@proton/components/containers/payments/subscription/helpers/getTotalBillingText';

import { getCheckoutUi } from '../../core/checkout';
import { COUPON_CODES, CYCLE } from '../../core/constants';
import { getPlanFromPlanIDs } from '../../core/plan/helpers';
import type { CouponConfig } from './interface';

export const summerSale2026Config: CouponConfig = {
    coupons: [COUPON_CODES.JUNE26SALE, COUPON_CODES.MAR26SALECS, COUPON_CODES.MAR26OFFERCS],
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

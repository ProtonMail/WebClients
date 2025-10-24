import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { COUPON_CODES, getCheckout, getPlanNameFromIDs } from '@proton/payments';

import { getShortBillingText } from '../helpers';
import type { CouponConfig } from './interface';

export const bf2025Config: CouponConfig = {
    coupons: [
        COUPON_CODES.BLACK_FRIDAY_2025,
        COUPON_CODES.BLACK_FRIDAY_2025_MONTH,
        COUPON_CODES.BLACK_FRIDAY_2025_BUNDLE,
        COUPON_CODES.BLACK_FRIDAY_2025_LIGHTNING,
        COUPON_CODES.BLACK_FRIDAY_2025_LUMOADDON,
        COUPON_CODES.BLACK_FRIDAY_2025_DEALPD,
        COUPON_CODES.BLACK_FRIDAY_2025_DEALVM,
    ],
    hidden: true,
    cyclePriceComparePosition: 'before',
    cyclePriceCompare: ({ suffix }, config) => {
        const checkout = getCheckout(config);

        return (
            <Price className="mr-2 text-strike" currency={checkout.currency} suffix={suffix}>
                {checkout.withoutDiscountPerMonth}
            </Price>
        );
    },

    cycleTitle: ({ cycle }, { planIDs, plansMap }) => {
        const cycleTitle = getShortBillingText(cycle, planIDs);
        const planTitle = (() => {
            const planName = getPlanNameFromIDs(planIDs);
            if (!planName) {
                return null;
            }
            const plan = plansMap[planName];
            if (!plan) {
                return null;
            }

            return plan.Title;
        })();

        if (!planTitle) {
            return cycleTitle;
        }

        return (
            <span>
                {planTitle} {cycleTitle}
            </span>
        );
    },

    showMigrationDiscountLossWarning: true,

    hideLumoAddonBanner: true,

    checkoutSubtitle: () => c('Label').t`Black Friday`,

    payCTA: () => c('Label').t`Get the deal`,
};

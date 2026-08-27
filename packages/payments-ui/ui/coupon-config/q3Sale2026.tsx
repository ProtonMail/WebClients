import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { getShortBillingText } from '@proton/components/containers/payments/subscription/helpers/getTotalBillingText';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { q3Sale2026Metadata } from '@proton/payments/core/coupon-config/configs/q3-sale-2026';
import { getPlanFromPlanIDs } from '@proton/payments/core/plan/helpers';

import type { CouponConfig } from './interface';

export const q3Sale2026Config: CouponConfig = {
    ...q3Sale2026Metadata,
    checkoutSubtitle: () => c('Title').t`September Sale`,
    payCTA: () => c('Action').t`Get the deal`,
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
            return undefined;
        }

        return `${planTitle} ${getShortBillingText(cycle, config.planIDs)}`;
    },
};

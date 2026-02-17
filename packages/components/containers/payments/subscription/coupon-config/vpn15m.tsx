import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { CYCLE, PLANS, getPlanNameFromIDs, hasLumoAddonFromPlanIDs } from '@proton/payments';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { getShortBillingText } from '../helpers';
import type { CouponConfig } from './interface';

export const vpn15mConfig: CouponConfig = {
    coupons: [],
    specialCases: [
        {
            planName: PLANS.VPN2024,
            cycle: CYCLE.FIFTEEN,
        },
    ],
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

            const withLumo = hasLumoAddonFromPlanIDs(planIDs);

            return withLumo ? `${plan.Title} + ${LUMO_SHORT_APP_NAME}` : plan.Title;
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

    payCTA: () => c('Label').t`Get the deal`,
};

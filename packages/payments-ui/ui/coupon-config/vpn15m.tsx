import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { getShortBillingText } from '@proton/components/containers/payments/subscription/helpers/getTotalBillingText';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import { vpn15mMetadata } from '@proton/payments/core/coupon-config/configs/vpn15m';
import { hasAddonFromPlanIDs } from '@proton/payments/core/plan/addons';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { CouponConfig } from './interface';

export const vpn15mConfig: CouponConfig = {
    ...vpn15mMetadata,
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

            const withLumo = hasAddonFromPlanIDs(ADDON_PREFIXES.LUMO, planIDs);

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

    payCTA: () => c('Label').t`Get the deal`,
};

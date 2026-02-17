import type { Currency } from '@proton/payments';
import { CYCLE, type PaymentsApi, type Plan, getPlanByName, getPlansMap, hasCycle } from '@proton/payments';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';

import type { DealWithPrices, OfferConfig } from '../interface';

export const fetchDealPrices = async (
    paymentsApi: PaymentsApi,
    offerConfig: OfferConfig,
    currency: Currency,
    plans: Plan[]
) => {
    const plansMap = getPlansMap(plans, currency, false);
    return Promise.all(
        offerConfig.deals.map(({ planIDs, cycle, couponCode }) => {
            const plan = getPlanByName(plans, planIDs, currency, undefined, false);

            if (!plan) {
                return Promise.resolve([]);
            }

            const withoutCouponPromise = getOptimisticCheckResult({
                cycle,
                planIDs,
                plansMap,
                currency,
            });

            const withCouponPromise = couponCode
                ? paymentsApi.checkSubscription({
                      Plans: planIDs,
                      CouponCode: couponCode,
                      Currency: currency,
                      Cycle: cycle,
                  })
                : withoutCouponPromise;

            // There are plans without montly price. The frontend shouldn't fetch them.
            const hasMonthlyCycle = hasCycle(plan, CYCLE.MONTHLY);
            const monthlyPromise = hasMonthlyCycle
                ? getOptimisticCheckResult({
                      planIDs,
                      currency,
                      cycle: CYCLE.MONTHLY,
                      plansMap,
                  })
                : undefined;

            return Promise.all([withCouponPromise, withoutCouponPromise, monthlyPromise]);
        })
    );
};

export const getDiscountWithCoupon = (deal: DealWithPrices) => {
    const { withCoupon = 0, withoutCouponMonthly = 0 } = deal.prices || {};
    const withCouponMonthly = withCoupon / deal.cycle;
    return 100 - Math.round((withCouponMonthly * 100) / withoutCouponMonthly);
};

export const getDiscount = (deal: DealWithPrices) => {
    const { withoutCoupon = 0, withoutCouponMonthly = 0 } = deal.prices || {};
    return 100 - Math.round((withoutCoupon * 100) / (withoutCouponMonthly * deal.cycle));
};

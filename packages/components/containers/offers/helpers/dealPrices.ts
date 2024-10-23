import type { PaymentsApi } from '@proton/payments';
import { CYCLE } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

import type { DealWithPrices, OfferConfig } from '../interface';

export const fetchDealPrices = async (paymentsApi: PaymentsApi, offerConfig: OfferConfig, currency: Currency) => {
    return Promise.all(
        offerConfig.deals.map(({ planIDs, cycle, couponCode }) => {
            const cyclePromise = paymentsApi.checkWithAutomaticVersion({
                Plans: planIDs,
                Currency: currency,
                Cycle: cycle,
            });

            const cycleWithCouponPromise = couponCode
                ? paymentsApi.checkWithAutomaticVersion({
                      Plans: planIDs,
                      CouponCode: couponCode,
                      Currency: currency,
                      Cycle: cycle,
                  })
                : cyclePromise;

            const monthlyPromise = paymentsApi.checkWithAutomaticVersion({
                Plans: planIDs,
                Currency: currency,
                Cycle: CYCLE.MONTHLY,
            });

            return Promise.all([cycleWithCouponPromise, cyclePromise, monthlyPromise]);
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

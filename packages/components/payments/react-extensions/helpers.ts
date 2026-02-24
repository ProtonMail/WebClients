import {
    type EnrichedCoupon,
    type SubscriptionEstimation,
    getHas2025OfferCoupon,
    isValidPlanName,
} from '@proton/payments';

export function enrichCoupon(checkResponse: SubscriptionEstimation) {
    try {
        if (checkResponse.Coupon && getHas2025OfferCoupon(checkResponse.Coupon?.Code)) {
            const Targets = Object.fromEntries(
                Object.entries(checkResponse.requestData.Plans).filter(([key]) => isValidPlanName(key))
            );

            const enrichedCoupon: EnrichedCoupon = {
                ...checkResponse.Coupon,
                Targets,
            };

            checkResponse.Coupon = enrichedCoupon;
        }
    } catch {}
}

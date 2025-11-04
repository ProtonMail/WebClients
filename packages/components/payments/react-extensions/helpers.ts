import {
    type EnrichedCheckResponse,
    type EnrichedCoupon,
    getHas2025OfferCoupon,
    isValidPlanName,
} from '@proton/payments';

export function enrichCoupon(checkResponse: EnrichedCheckResponse) {
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

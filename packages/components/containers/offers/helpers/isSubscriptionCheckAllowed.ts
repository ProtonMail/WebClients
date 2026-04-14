import { isSubscriptionCheckForbidden } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';

import type { OfferConfig } from '../interface';

const isSubscriptionCheckAllowed = (subscription: MaybeFreeSubscription, offerConfig: OfferConfig) => {
    return offerConfig.deals.some(
        (deal) =>
            !isSubscriptionCheckForbidden(subscription, {
                planIDs: deal.planIDs,
                cycle: deal.cycle,
                coupon: deal.couponCode,
            })
    );
};

export default isSubscriptionCheckAllowed;

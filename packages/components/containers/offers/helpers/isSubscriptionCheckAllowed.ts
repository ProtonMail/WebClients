import { type MaybeFreeSubscription, isSubscriptionCheckForbidden } from '@proton/payments/core/subscription/helpers';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';

import type { OfferConfig } from '../interface';

export const isSubscriptionCheckAllowed = (
    multiSubscriptionContext: MultiSubscriptionContext,
    subscription: MaybeFreeSubscription,
    offerConfig: OfferConfig
) => {
    return offerConfig.deals.some(
        (deal) =>
            !isSubscriptionCheckForbidden(multiSubscriptionContext, {
                editedSubscription: subscription,
                planIDs: deal.planIDs,
                cycle: deal.cycle,
                coupon: deal.couponCode,
            })
    );
};

import { type Subscription, isSubscriptionCheckForbidden } from '@proton/payments';

import type { OfferConfig } from '../interface';

const isSubscriptionCheckAllowed = (subscription: Subscription, offerConfig: OfferConfig) => {
    return offerConfig.deals.some((deal) => !isSubscriptionCheckForbidden(subscription, deal.planIDs, deal.cycle));
};

export default isSubscriptionCheckAllowed;

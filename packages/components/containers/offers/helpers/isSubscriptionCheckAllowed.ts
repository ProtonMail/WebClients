import { type Subscription, isSubcriptionCheckForbidden } from '@proton/payments';

import type { OfferConfig } from '../interface';

const isSubscriptionCheckAllowed = (subscription: Subscription, offerConfig: OfferConfig) => {
    return offerConfig.deals.some((deal) => !isSubcriptionCheckForbidden(subscription, deal.planIDs, deal.cycle));
};

export default isSubscriptionCheckAllowed;

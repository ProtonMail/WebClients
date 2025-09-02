import { type Subscription, isCheckForbidden } from '@proton/payments';

import type { OfferConfig } from '../interface';

const isCheckAllowed = (subscription: Subscription, offerConfig: OfferConfig) => {
    return offerConfig.deals.some((deal) => !isCheckForbidden(subscription, deal.planIDs, deal.cycle));
};

export default isCheckAllowed;

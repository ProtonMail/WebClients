import { PLANS } from '@proton/payments/core/constants';
import { getSubscriptionSearchParamsString } from '@proton/payments/core/subscription/search-params';

export const getMeetUpgradeLink = (hasSubscriptionWithoutMeet: boolean) => {
    const searchParams = getSubscriptionSearchParamsString(
        hasSubscriptionWithoutMeet
            ? {
                  totalMeet: 1,
              }
            : {
                  plan: PLANS.MEET_BUSINESS,
              }
    );

    return `/dashboard?${searchParams}`;
};

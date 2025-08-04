import { createHooks } from '@proton/redux-utilities';

import { previousSubscriptionThunk, selectPreviousSubscription } from './index';

const defaultValue = { hasHadSubscription: false, previousSubscriptionEndTime: 0 };

const hooks = createHooks(previousSubscriptionThunk, selectPreviousSubscription);

/**
 * Gets the previous subscription end time
 * Can be used to determine if the user has had a subscription in the past.
 * ie if `hasHadSubscription` is true for a free user, then they have churned.
 */
export const usePreviousSubscription = () => {
    const [value, loading] = hooks.useValue();
    return [value || defaultValue, loading] as const;
};

export const useGetPreviousSubscriptionEnd = hooks.useGet;

import { useCallback } from 'react';
import { FREE_SUBSCRIPTION } from 'proton-shared/lib/constants';
import { SubscriptionModel } from 'proton-shared/lib/models/subscriptionModel';
import { useApi, useCache, useCachedResult, useUser } from 'react-components';

export const useSubscription = () => {
    const [user] = useUser();
    const api = useApi();
    const cache = useCache();
    const load = useCallback(() => {
        if (user.isPaid) {
            return SubscriptionModel.get(api);
        }

        return Promise.resolve(FREE_SUBSCRIPTION);
    }, [user]);
    return useCachedResult(cache, SubscriptionModel.key, load);
};

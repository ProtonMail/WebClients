import { useCallback } from 'react';

import { FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import { SubscriptionModel as tsSubscriptionModel } from '@proton/shared/lib/interfaces';
import { SubscriptionModel } from '@proton/shared/lib/models/subscriptionModel';
import { UserModel } from '@proton/shared/lib/models/userModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const useSubscription = (): [tsSubscriptionModel, boolean, Error] => {
    const cache = useCache();
    const api = useApi();

    const miss = useCallback(() => {
        const { value: user = {} } = cache.get(UserModel.key) || {};
        if (user.isAdmin && Boolean(user.Subscribed)) {
            return SubscriptionModel.get(api);
        }
        // Member cannot fetch subscription
        return Promise.resolve(FREE_SUBSCRIPTION);
    }, [api, cache]);

    return useCachedModelResult(cache, SubscriptionModel.key, miss);
};

/**
 * Unlike the return type of {@link useSubscription}, it doesn't have the third element in the array. That's because
 * {@link useCachedModelResult} never actually returns 3-element arrays.
 */
export type SubscriptionResult =
    | [subscription: tsSubscriptionModel | typeof FREE_SUBSCRIPTION, loading: false]
    | [subscription: undefined, loading: true];

/**
 * Same as {@link useSubscription} but *better*. In a sense of type-safety.
 */
export const useTypedSubscription = (): SubscriptionResult => {
    return useSubscription() as any;
};

export default useSubscription;

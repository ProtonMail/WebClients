import { useCallback } from 'react';
import { SubscriptionModel as tsSubscriptionModel } from 'proton-shared/lib/interfaces';
import { FREE_SUBSCRIPTION } from 'proton-shared/lib/constants';
import { SubscriptionModel } from 'proton-shared/lib/models/subscriptionModel';
import { UserModel } from 'proton-shared/lib/models/userModel';

import useCachedModelResult from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

const useSubscription = (): [tsSubscriptionModel, boolean, Error] => {
    const cache = useCache();
    const api = useApi();

    const miss = useCallback(() => {
        const { value: user = {} } = cache.get(UserModel.key) || {};
        if (user.isAdmin) {
            return SubscriptionModel.get(api);
        }
        return Promise.resolve(FREE_SUBSCRIPTION);
    }, [api, cache]);

    return useCachedModelResult(cache, SubscriptionModel.key, miss);
};

export default useSubscription;

import { useCallback } from 'react';
import { FREE_SUBSCRIPTION } from 'proton-shared/lib/constants';
import { SubscriptionModel } from 'proton-shared/lib/models/subscriptionModel';
import { UserModel } from 'proton-shared/lib/models/userModel';

import useCachedModelResult from './useCachedModelResult';
import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';

const useSubscription = () => {
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

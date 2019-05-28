import { FREE_SUBSCRIPTION } from 'proton-shared/lib/constants';
import { SubscriptionModel } from 'proton-shared/lib/models/subscriptionModel';
import { useApi, useCachedAsyncResult, useUser } from 'react-components';

export const useSubscription = () => {
    const [user] = useUser();
    const api = useApi();

    return useCachedAsyncResult(
        SubscriptionModel.key,
        () => {
            if (user.isPaid) {
                return SubscriptionModel.get(api);
            }
            return Promise.resolve(FREE_SUBSCRIPTION);
        },
        []
    ); // Don't need to depend on the user changes since the subscription is updated through the event manager
};

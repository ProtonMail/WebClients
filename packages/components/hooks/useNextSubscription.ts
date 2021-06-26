import { useState, useEffect } from 'react';
import { checkSubscription } from '@proton/shared/lib/api/payments';
import { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces/Subscription';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';

import useApi from './useApi';
import useLoading from './useLoading';
import useSubscription from './useSubscription';
import { useUser } from './useUser';

const useNextSubscription = () => {
    const [user] = useUser();
    const [nextSubscription, setNextSubscription] = useState<SubscriptionCheckResponse | undefined>();
    const [loading, withLoading] = useLoading(user.isPaid);
    const api = useApi();
    const [subscription] = useSubscription();

    const getNextSubscription = async () => {
        // Without any coupon
        const next = await api<SubscriptionCheckResponse>(
            checkSubscription({
                PlanIDs: getPlanIDs(subscription),
                Currency: subscription.Currency,
                Cycle: subscription.Cycle,
            })
        );
        setNextSubscription(next);
    };

    useEffect(() => {
        if (subscription && subscription.Plans) {
            withLoading(getNextSubscription());
        }
    }, [subscription]);

    return [nextSubscription, loading];
};

export default useNextSubscription;

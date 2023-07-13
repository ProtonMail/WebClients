import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { checkSubscription } from '@proton/shared/lib/api/payments';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces/Subscription';

import useApi from './useApi';
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
                Plans: getPlanIDs(subscription),
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

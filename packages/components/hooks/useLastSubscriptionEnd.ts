import { useEffect, useState } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';
import { getLastCancelledSubscription } from '@proton/shared/lib/api/payments';
import { LatestSubscription } from '@proton/shared/lib/interfaces';

import useApi from './useApi';
import useLoading from './useLoading';
import useUser from './useUser';

const useLastSubscriptionEnd = (): [latestSubscription: number, loading: boolean] => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [{ isPaid }] = useUser();
    const [latestSubscription, setLatestSubscription] = useState<number>(0);
    const isMounted = useIsMounted();

    useEffect(() => {
        if (isPaid) {
            setLatestSubscription(0);
            return;
        }
        const run = async () => {
            try {
                const { LastSubscriptionEnd = 0 } = await api<LatestSubscription>(getLastCancelledSubscription());

                if (isMounted()) {
                    setLatestSubscription(LastSubscriptionEnd);
                }
            } catch (e) {
                // Ignore
            }
        };
        void withLoading(run());
    }, [isPaid]);

    return [latestSubscription, loading];
};

export default useLastSubscriptionEnd;

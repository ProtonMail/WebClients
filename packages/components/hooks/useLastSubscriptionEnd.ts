import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { LatestSubscription } from '@proton/payments';
import { getLastCancelledSubscription } from '@proton/shared/lib/api/payments';

import useApi from './useApi';
import useUser from './useUser';

let promise: Promise<LatestSubscription> | undefined;

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
                if (!promise) {
                    promise = api<LatestSubscription>(getLastCancelledSubscription());
                }

                const { LastSubscriptionEnd = 0 } = await promise;

                if (isMounted()) {
                    setLatestSubscription(LastSubscriptionEnd || 0);
                }
            } catch (e) {
                // Ignore
            } finally {
                // Reset promise to allow a new request
                promise = undefined;
            }
        };
        void withLoading(run());
    }, [isPaid]);

    return [latestSubscription, loading];
};

export default useLastSubscriptionEnd;

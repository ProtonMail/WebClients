import { useEffect, useState } from 'react';

import useCache from '@proton/components/hooks/useCache';

import { useBlockchainClient } from '../../hooks/useBlockchainClient';

const FEES_ESTIMATION_KEY = 'fees_estimation';

export const useBlockchainFeesEstimation = () => {
    const cache = useCache();
    const blockchainClient = useBlockchainClient();

    const [feesEstimation, setFeesEstimation] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fees = cache.get(FEES_ESTIMATION_KEY);

        if (fees) {
            setFeesEstimation(fees);
            return;
        } else {
            setLoading(true);
            blockchainClient
                .getFeesEstimation()
                .then((est) => {
                    setFeesEstimation(est);
                    cache.set(FEES_ESTIMATION_KEY, est);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
        // blockchainClient is stable at mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache]);

    return { feesEstimation, loading };
};

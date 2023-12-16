import { useEffect, useState } from 'react';

import { useCache } from '@proton/components/hooks';

import { WasmChain } from '../../pkg';

const FEES_ESTIMATION_KEY = 'fees_estimation';

export const useBlockchainFeesEstimation = () => {
    const cache = useCache();
    const [feesEstimation, setFeesEstimation] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fees = cache.get(FEES_ESTIMATION_KEY);
        if (fees) {
            setFeesEstimation(fees);
            return;
        } else {
            setLoading(true);
            new WasmChain()
                .get_fees_estimation()
                .then((est) => {
                    setFeesEstimation(est);
                    cache.set(FEES_ESTIMATION_KEY, est);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
    }, [cache]);

    return { feesEstimation, loading };
};

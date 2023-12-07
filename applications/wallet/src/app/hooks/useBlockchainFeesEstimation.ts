import { useCallback, useEffect, useState } from 'react';

import { useCache } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import { WasmChain } from '../../pkg';

const FEES_ESTIMATION_KEY = 'fees_estimation';

export const useBlockchainFeesEstimation = () => {
    const cache = useCache();
    const [feesEstimation, setFeesEstimation] = useState<Map<string, number>>();
    const [loading, withLoading] = useLoading();

    const fetchFeesEstimation = useCallback(async () => {
        if (cache.get(FEES_ESTIMATION_KEY)) {
            return feesEstimation;
        } else {
            await withLoading(new WasmChain().get_fees_estimation().then((est) => setFeesEstimation(est)));
        }
    }, [cache, feesEstimation, withLoading]);

    useEffect(() => {
        void fetchFeesEstimation();
    }, [fetchFeesEstimation]);

    return { feesEstimation, loading };
};

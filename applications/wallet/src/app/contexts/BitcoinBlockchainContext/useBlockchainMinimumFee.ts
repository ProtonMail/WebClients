import { useEffect, useState } from 'react';

import useCache from '@proton/components/hooks/useCache';

import { useBlockchainClient } from '../../hooks/useBlockchainClient';

const MINIMUM_FEE_KEY = 'minimum_fee';

export const useBlockchainMinimumFee = () => {
    const cache = useCache();
    const blockchainClient = useBlockchainClient();

    const [minimumFee, setMinimumFee] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const minFee = cache.get(MINIMUM_FEE_KEY);

        if (minFee) {
            setMinimumFee(minFee);
            return;
        } else {
            setLoading(true);
            blockchainClient
                .getMempoolMinFee()
                .then((fee) => {
                    setMinimumFee(fee);
                    cache.set(MINIMUM_FEE_KEY, fee);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
        // blockchainClient is stable at mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache]);

    return { minimumFee, loading };
};

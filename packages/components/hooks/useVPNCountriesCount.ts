import { useEffect, useState } from 'react';

import { queryVPNCountriesCount } from '@proton/shared/lib/api/vpn';
import { PLANS } from '@proton/shared/lib/constants';
import { VPNCountries } from '@proton/shared/lib/interfaces';

import useApi from './useApi';
import useLoading from './useLoading';

const DEFAULT_RESULT: VPNCountries = {
    free_vpn: { count: 4 },
    [PLANS.VPN]: { count: 15 },
};
let cache: Promise<{ Counts: { Count: number }[] }> | undefined;

const useVPNCountriesCount = (): [VPNCountries, boolean] => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [result, setResult] = useState(DEFAULT_RESULT);

    useEffect(() => {
        const query = async () => {
            if (!cache) {
                cache = api<{ Counts: { Count: number }[] }>(queryVPNCountriesCount());
            }
            const { Counts = [] } = await cache;
            const result = (
                [
                    [0, 'free_vpn'],
                    [2, PLANS.VPN],
                ] as const
            ).reduce(
                (acc, [idx, planName]) => {
                    const count = Counts[idx]?.Count || 0;
                    return {
                        ...acc,
                        [planName]: { count },
                    };
                },
                { ...DEFAULT_RESULT }
            );
            // This is specific for VPN Basic plan
            result[PLANS.VPN] = { count: Math.floor(result[PLANS.VPN].count / 10) * 10 };
            setResult(result);
        };

        void withLoading(query());
    }, []);

    return [result, loading];
};

export default useVPNCountriesCount;

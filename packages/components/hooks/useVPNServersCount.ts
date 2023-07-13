import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import {
    queryVPNCountriesCount,
    queryVPNLogicalServerInfoCount,
    queryVPNServersCount,
} from '@proton/shared/lib/api/vpn';
import {
    VPNCountriesCount,
    VPNLogicalsCount,
    VPNServersCount,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';

import useApi from './useApi';

const DEFAULT_RESULT: VPNServersCountData = {
    free: { countries: 3, servers: 150 },
    paid: { countries: 190, servers: 1900 },
};
let cache: Promise<[VPNServersCount, VPNCountriesCount, VPNLogicalsCount]> | undefined;

const useVPNServersCount = (): [VPNServersCountData, boolean] => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [result, setResult] = useState<VPNServersCountData>(DEFAULT_RESULT);

    useEffect(() => {
        const query = async () => {
            if (!cache) {
                cache = Promise.all([
                    api<VPNServersCount>(queryVPNServersCount()),
                    api<VPNCountriesCount>(queryVPNCountriesCount()),
                    api<VPNLogicalsCount>(queryVPNLogicalServerInfoCount()),
                ]);
            }
            const promise = cache;

            const [serversCount, countriesCount, logicalsCount] = await promise;

            const countFreeVPNCountries =
                countriesCount.Counts.find((count) => count.MaxTier === 0)?.Count || DEFAULT_RESULT.free.countries;
            const countFreeVpnServers = logicalsCount.Counts['0'];

            const countPaidVPNServers = Math.floor(serversCount.Servers / 50) * 50;
            const countPaidVPNCountries = Math.floor(serversCount.Countries / 5) * 5;

            const updatedResult: VPNServersCountData = {
                free: {
                    servers: countFreeVpnServers,
                    countries: countFreeVPNCountries,
                },
                paid: {
                    servers: countPaidVPNServers,
                    countries: countPaidVPNCountries,
                },
            };

            setResult(updatedResult);
        };

        void withLoading(query());
    }, []);

    return [result, loading];
};

export default useVPNServersCount;

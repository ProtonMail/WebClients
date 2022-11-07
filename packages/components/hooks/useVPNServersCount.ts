import { useEffect, useState } from 'react';

import { queryVPNLogicalServerInfo } from '@proton/shared/lib/api/vpn';
import { PLANS } from '@proton/shared/lib/constants';
import { VPNServers } from '@proton/shared/lib/interfaces';

import useApi from './useApi';
import useLoading from './useLoading';

const DEFAULT_RESULT: VPNServers = {
    free_vpn: 23,
    [PLANS.VPN]: 1200,
};
let cache: Promise<{ LogicalServers: any }> | undefined;

const useVPNServersCount = (): [VPNServers, boolean] => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [result, setResult] = useState(DEFAULT_RESULT);

    useEffect(() => {
        const query = async () => {
            if (!cache) {
                cache = api<{ LogicalServers: any }>(queryVPNLogicalServerInfo());
            }
            const promise = cache;

            const { LogicalServers: resultLogicalServerInfo } = await promise;

            const countFreeVPNServers = resultLogicalServerInfo.filter(
                (server: { Tier: number }) => server.Tier === 0
            ).length;

            const countBasicVPNServers = resultLogicalServerInfo.filter(
                (server: { Tier: number }) => server.Tier === 1
            ).length;

            const countPaidVPNServers = resultLogicalServerInfo.filter(
                (server: { Tier: number }) => server.Tier === 2
            ).length;

            let countPlusVpnServersShow = countPaidVPNServers + countBasicVPNServers + countFreeVPNServers;

            countPlusVpnServersShow = Math.floor(countPlusVpnServersShow / 100) * 100;

            const updatedResult = {
                ...DEFAULT_RESULT,
                free_vpn: countFreeVPNServers,
                [PLANS.VPN]: countPlusVpnServersShow,
            };

            setResult(updatedResult);
        };

        void withLoading(query());
    }, []);

    return [result, loading];
};

export default useVPNServersCount;

import { useEffect, useState } from 'react';
import { queryVPNLogicalServerInfo } from '@proton/shared/lib/api/vpn';

import { PLANS } from '@proton/shared/lib/constants';
import { VPNServers } from '@proton/shared/lib/interfaces';
import useApi from './useApi';
import useLoading from './useLoading';

const DEFAULT_RESULT: VPNServers = {
    free_vpn: 23,
    [PLANS.VPNBASIC]: 350,
    [PLANS.VPNPLUS]: 1200,
};

const useVPNServersCount = (): [VPNServers, boolean] => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [result, setResult] = useState(DEFAULT_RESULT);

    useEffect(() => {
        const query = async () => {
            const { LogicalServers: resultLogicalServerInfo } = await api(queryVPNLogicalServerInfo());

            const countFreeVPNServers = resultLogicalServerInfo.filter(
                (server: { Tier: number }) => server.Tier === 0
            ).length;

            const countBasicVPNServers = resultLogicalServerInfo.filter(
                (server: { Tier: number }) => server.Tier === 1
            ).length;

            const countPlusVPNServers = resultLogicalServerInfo.filter(
                (server: { Tier: number }) => server.Tier === 2
            ).length;

            let countBasicVpnServersShow = countBasicVPNServers + countFreeVPNServers;
            let countPlusVpnServersShow = countPlusVPNServers + countBasicVPNServers + countFreeVPNServers;

            countBasicVpnServersShow = Math.floor(countBasicVpnServersShow / 50) * 50;
            countPlusVpnServersShow = Math.floor(countPlusVpnServersShow / 100) * 100;

            const updatedResult = {
                ...DEFAULT_RESULT,
                free_vpn: countFreeVPNServers,
                [PLANS.VPNBASIC]: countBasicVpnServersShow,
                [PLANS.VPNPLUS]: countPlusVpnServersShow,
            };

            setResult(updatedResult);
        };

        void withLoading(query());
    }, []);

    return [result, loading];
};

export default useVPNServersCount;

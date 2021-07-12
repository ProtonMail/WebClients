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

            const updatedResult = {
                ...DEFAULT_RESULT,
                free_vpn: countFreeVPNServers,
            };

            setResult(updatedResult);
        };

        void withLoading(query());
    }, []);

    return [result, loading];
};

export default useVPNServersCount;

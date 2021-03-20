import { useEffect, useState } from 'react';
import { queryVPNLogicalServerInfo } from 'proton-shared/lib/api/vpn';
import { VPNServer } from 'proton-shared/lib/interfaces/VPNServer';

import useApi from './useApi';
import useLoading from './useLoading';

const useVPNCountries = () => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [logicalServers, setLogicalServers] = useState<VPNServer[]>([]);

    const query = async () => {
        const { LogicalServers = [] } = await api(queryVPNLogicalServerInfo());
        setLogicalServers(LogicalServers);
    };

    const getCountries = (servers: VPNServer[]) =>
        Object.keys(servers.reduce((countries, { ExitCountry }) => ({ ...countries, [ExitCountry]: true }), {}));

    const free = getCountries(logicalServers.filter(({ Tier }) => Tier === 0));
    const basic = getCountries(logicalServers.filter(({ Tier }) => Tier <= 1));
    const all = getCountries(logicalServers);

    useEffect(() => {
        void withLoading(query());
    }, []);

    return [
        {
            free,
            basic,
            all,
        },
        loading,
    ] as const;
};

export default useVPNCountries;

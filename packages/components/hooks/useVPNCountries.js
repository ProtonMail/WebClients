import { useApiResult } from 'react-components';
import { queryVPNLogicalServerInfo } from 'proton-shared/lib/api/vpn';

const useVPNCountries = () => {
    const { loading, result } = useApiResult(queryVPNLogicalServerInfo, []);

    const getCountries = (servers) =>
        Object.keys(servers.reduce((countries, { ExitCountry }) => ({ ...countries, [ExitCountry]: true }), {}));

    const free = result ? getCountries(result.LogicalServers.filter(({ Tier }) => Tier === 0)) : [];
    const basic = result ? getCountries(result.LogicalServers.filter(({ Tier }) => Tier <= 1)) : [];
    const all = result ? getCountries(result.LogicalServers) : [];

    return [
        {
            free,
            basic,
            all
        },
        loading
    ];
};

export default useVPNCountries;

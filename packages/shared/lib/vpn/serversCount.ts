import { queryVPNServersCount } from '@proton/shared/lib/api/vpn';
import { FREE_COUNTRY_COUNT, FREE_SERVER_COUNT } from '@proton/shared/lib/constants';
import type { Api, VPNServersCount, VPNServersCountData } from '@proton/shared/lib/interfaces';

export const defaultVPNServersCountData: VPNServersCountData = {
    free: { countries: FREE_COUNTRY_COUNT, servers: FREE_SERVER_COUNT },
    paid: { countries: 70, servers: 1900 },
};

export const getVPNServersCountData = async (api: Api) => {
    const [serversCount] = await Promise.all([api<VPNServersCount>(queryVPNServersCount())]);

    const countPaidVPNServers = Math.floor(serversCount.Servers / 50) * 50;
    const countPaidVPNCountries = Math.floor(serversCount.Countries / 5) * 5;

    const result: VPNServersCountData = {
        free: {
            servers: defaultVPNServersCountData.free.servers,
            countries: defaultVPNServersCountData.free.countries,
        },
        paid: {
            servers: countPaidVPNServers,
            countries: countPaidVPNCountries,
        },
    };
    return result;
};

import { queryVPNServersCount } from '@proton/shared/lib/api/vpn';
import { FREE_COUNTRY_COUNT, FREE_SERVER_COUNT } from '@proton/shared/lib/constants';
import type { Api, VPNServersCount, VPNServersCountData } from '@proton/shared/lib/interfaces';

export const defaultVPNServersCountData: VPNServersCountData = {
    free: { countries: FREE_COUNTRY_COUNT, servers: FREE_SERVER_COUNT },
    paid: { countries: 70, servers: 1900 },
};

export const getVPNServersCountData = async (api: Api) => {
    const isDrive = window.location.origin.includes('drive');
    // This is a temporary solution to quickly enable checkout inside Drive app.
    // We should find another way to not depend on a VPN endpoint inside the offer viewer.
    if (isDrive) {
        return {
            free: {
                servers: defaultVPNServersCountData.free.servers,
                countries: defaultVPNServersCountData.free.countries,
            },
            paid: {
                servers: 15000,
                countries: 120,
            },
        };
    }

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

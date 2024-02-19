import {
    queryVPNCountriesCount,
    queryVPNLogicalServerInfoCount,
    queryVPNServersCount,
} from '@proton/shared/lib/api/vpn';
import type {
    Api,
    VPNCountriesCount,
    VPNLogicalsCount,
    VPNServersCount,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';

export const defaultVPNServersCountData: VPNServersCountData = {
    free: { countries: 3, servers: 150 },
    paid: { countries: 70, servers: 1900 },
};

export const getVPNServersCountData = async (api: Api) => {
    const [serversCount, countriesCount, logicalsCount] = await Promise.all([
        api<VPNServersCount>(queryVPNServersCount()),
        api<VPNCountriesCount>(queryVPNCountriesCount()),
        api<VPNLogicalsCount>(queryVPNLogicalServerInfoCount()),
    ]);

    const countFreeVPNCountries =
        countriesCount.Counts.find((count) => count.MaxTier === 0)?.Count || defaultVPNServersCountData.free.countries;
    const countFreeVpnServers = logicalsCount.Counts['0'];

    const countPaidVPNServers = Math.floor(serversCount.Servers / 50) * 50;
    const countPaidVPNCountries = Math.floor(serversCount.Countries / 5) * 5;

    const result: VPNServersCountData = {
        free: {
            servers: countFreeVpnServers,
            countries: countFreeVPNCountries,
        },
        paid: {
            servers: countPaidVPNServers,
            countries: countPaidVPNCountries,
        },
    };
    return result;
};

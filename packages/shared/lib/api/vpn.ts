import { HTTP_ERROR_CODES } from '../errors';

export const getClientVPNInfo = () => ({
    method: 'get',
    url: 'vpn',
});

export const queryVPNCountriesCount = () => ({
    method: 'get',
    url: 'vpn/countries/count',
});

export const queryVPNLogicalServerInfo = () => ({
    method: 'get',
    url: 'vpn/logicals',
});

export const queryVPNLogicalServerInfoCount = () => ({
    method: 'get',
    url: 'vpn/logicals/count',
    params: {
        GroupBy: 'Tier',
    },
});

export const queryVPNServersCount = () => ({
    method: 'get',
    url: 'vpn/v1/servers-count',
});

export const getLocation = () => ({
    method: 'get',
    url: 'vpn/location',
    ignoreHandler: [HTTP_ERROR_CODES.TOO_MANY_REQUESTS],
});

export const getVPNServerConfig = ({ LogicalID, ServerID, Country, Category, Tier, Platform, Protocol }: any) => ({
    method: 'get',
    url: 'vpn/config',
    output: 'arrayBuffer',
    params: { LogicalID, ServerID, Country, Category, Tier, Platform, Protocol },
});

export const resetVPNSettings = () => ({
    method: 'put',
    url: 'vpn/settings/reset',
});

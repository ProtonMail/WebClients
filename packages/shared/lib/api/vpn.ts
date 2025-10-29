import { HTTP_ERROR_CODES } from '../errors';

export const getClientVPNInfo = () => ({
    method: 'get',
    url: 'vpn/v2',
});

export const queryVPNCountriesCount = () => ({
    method: 'get',
    url: 'vpn/v1/countries/count',
});

export const queryVPNLogicalServerInfo = () => ({
    method: 'get',
    url: 'vpn/v1/logicals',
});

export const queryVPNLogicalServerInfoCount = () => ({
    method: 'get',
    url: 'vpn/v1/logicals/count',
    params: {
        GroupBy: 'Tier',
    },
});

export const queryVPNLogicalServerLookup = (name: string) => ({
    method: 'get',
    url: `vpn/v1/logicals/lookup/${encodeURIComponent(name)}`,
});

export const queryVPNServersCount = () => ({
    method: 'get',
    url: 'vpn/v1/servers-count',
});

export const getLocation = () => ({
    method: 'get',
    url: 'vpn/v1/location',
    ignoreHandler: [HTTP_ERROR_CODES.TOO_MANY_REQUESTS],
});

export const getVPNServerConfig = ({ LogicalID, ServerID, Country, Category, Tier, Platform, Protocol }: any) => ({
    method: 'get',
    url: 'vpn/v1/config',
    output: 'arrayBuffer',
    params: { LogicalID, ServerID, Country, Category, Tier, Platform, Protocol },
});

export const resetVPNSettings = () => ({
    method: 'put',
    url: 'vpn/v1/settings/reset',
});

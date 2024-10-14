import type { B2BLogsQuery } from '../interfaces/B2BLogs';

export const getPassLogs = (params: B2BLogsQuery) => ({
    url: 'account/organization/events/pass',
    method: 'get',
    params,
});

export const getPassEventTypes = () => ({
    url: 'account/organization/events/pass/event-types',
    method: 'get',
});

export const getVPNLogs = (params: B2BLogsQuery) => ({
    url: 'account/organization/events/vpn',
    method: 'get',
    params,
});

export const getVpnEventTypes = () => ({
    url: 'account/organization/events/vpn/event-types',
    method: 'get',
});

export const getVPNLogDownload = (params: B2BLogsQuery) => ({
    url: 'account/organization/events/export/vpn',
    method: 'get',
    params,
    output: 'text',
    headers: {
        accept: 'text/csv',
    },
});

export const getPassLogsDownload = (params: B2BLogsQuery) => ({
    url: 'account/organization/events/export/pass',
    method: 'get',
    params,
    output: 'text',
    headers: {
        accept: 'text/csv',
    },
});

export const getShareID = (vaultID: string) => ({
    url: `pass/v1/vault/share/${vaultID}`,
    method: 'get',
});

export const getOrgAuthLogs = (query: string) => {
    return {
        url: `account/organization/logs/auth?${query}`,
        method: 'get',
    };
};

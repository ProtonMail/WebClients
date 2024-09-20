import type { B2BLogsQuery } from '../interfaces/B2BLogs';

export const getPassLogs = (params: B2BLogsQuery) => ({
    url: 'account/organization/logs/pass',
    method: 'get',
    params,
});

export const getVPNLogs = (params: B2BLogsQuery) => ({
    url: 'account/organization/logs/vpn',
    method: 'get',
    params,
});

export const getVPNLogDownload = (params: B2BLogsQuery) => ({
    url: 'account/organization/logs/export/vpn',
    method: 'get',
    params,
    output: 'text',
    headers: {
        accept: 'text/csv',
    },
});

export const getPassLogsDownload = (params: B2BLogsQuery) => ({
    url: 'account/organization/logs/export/pass',
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

import { B2BLogsQuery } from '../interfaces/B2BLogs';

export const getPassLogs = (params: B2BLogsQuery) => ({
    url: 'account/organization/logs/pass',
    method: 'get',
    params,
});

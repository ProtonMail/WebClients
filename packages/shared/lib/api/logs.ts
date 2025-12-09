export const queryLogs = (params: { Page: number; PageSize: number }) => ({
    method: 'get',
    url: 'core/v4/logs/auth',
    params,
});

export const clearLogs = () => ({
    method: 'delete',
    url: 'core/v4/logs/auth',
});

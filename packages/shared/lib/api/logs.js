export const queryLogs = (params) => ({
    method: 'get',
    url: 'core/v4/logs/auth',
    params,
});

export const clearLogs = () => ({
    method: 'delete',
    url: 'core/v4/logs/auth',
});

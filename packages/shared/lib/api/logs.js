export const queryLogs = (params) => ({
    method: 'get',
    url: 'logs/auth',
    params
});

export const clearLogs = () => ({
    method: 'delete',
    url: 'logs/auth'
});

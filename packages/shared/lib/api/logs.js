export const queryLogs = () => ({
    method: 'get',
    url: 'logs/auth'
});

export const clearLogs = () => ({
    method: 'delete',
    url: 'logs/auth'
});
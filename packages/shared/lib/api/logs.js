export const queryLogs = ({ Page, PageSize } = {}) => ({
    method: 'get',
    url: 'logs/auth',
    params: { Page, PageSize }
});

export const clearLogs = () => ({
    method: 'delete',
    url: 'logs/auth'
});

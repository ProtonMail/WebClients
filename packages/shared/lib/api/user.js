export const getUser = () => ({
    url: 'users',
    method: 'get'
});

export const queryUnlock = () => ({
    url: 'users/unlock',
    method: 'put'
});

export const getUser = () => ({
    url: 'users',
    method: 'get'
});

export const queryUnlock = () => ({
    url: 'users/unlock',
    method: 'put'
});

export const deleteUser = (data) => ({
    url: 'users/delete',
    method: 'put',
    data
});

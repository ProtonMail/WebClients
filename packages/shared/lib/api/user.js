export const getUser = (UID) => ({
    url: 'users',
    method: 'get',
    headers: UID
        ? {
              'x-pm-uid': UID
          }
        : undefined
});

export const queryUnlock = () => ({
    url: 'users/unlock',
    method: 'put'
});

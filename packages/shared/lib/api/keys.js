export const getKeySalts = (UID) => ({
    url: 'keys/salts',
    method: 'get',
    headers: {
        'x-pm-uid': UID
    }
});

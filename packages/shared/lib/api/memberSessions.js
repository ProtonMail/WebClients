export const createSession = (memberID, data) => ({
    method: 'post',
    url: `members/${memberID}/sessions`,
    data
});

export const getSessions = (memberID) => ({
    method: 'get',
    url: `members/${memberID}/sessions`
});

export const revokeSession = (memberID, uid) => ({
    method: 'delete',
    url: `members/${memberID}/sessions/${uid}`
});

export const revokeSessions = (memberID) => ({
    method: 'delete',
    url: `members/${memberID}/sessions`
});

export const createSession = (memberID: string, data: any) => ({
    method: 'post',
    url: `members/${memberID}/sessions`,
    data,
});

export const getSessions = (memberID: string) => ({
    method: 'get',
    url: `members/${memberID}/sessions`,
});

export const revokeSession = (memberID: string, uid: string) => ({
    method: 'delete',
    url: `members/${memberID}/sessions/${uid}`,
});

export const revokeSessions = (memberID: string) => ({
    method: 'delete',
    url: `members/${memberID}/sessions`,
});

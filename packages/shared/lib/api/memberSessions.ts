export const revokeSessions = (memberID: string) => ({
    method: 'delete',
    url: `members/${memberID}/sessions`,
});

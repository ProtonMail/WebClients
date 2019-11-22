export const queryUserShares = () => ({
    method: 'get',
    url: 'drive/shares'
});

export const queryShareBootstrap = (shareID: string) => ({
    method: `get`,
    url: `drive/shares/${shareID}`
});

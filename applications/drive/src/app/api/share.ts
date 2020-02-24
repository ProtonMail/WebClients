export const queryUserShares = () => ({
    method: 'get',
    url: 'drive/shares'
});

export const queryShareBootstrap = (shareID: string) => ({
    method: `get`,
    url: `drive/shares/${shareID}`
});

export const queryRenameLink = (
    shareID: string,
    linkID: string,
    data: { Name: string; MimeType: string; Hash: string }
) => ({
    method: `put`,
    url: `drive/shares/${shareID}/links/${linkID}/rename`,
    data
});

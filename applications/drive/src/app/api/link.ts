export const queryCheckAvailableHashes = (shareId: string, linkId: string, data: { Hashes: string[] }) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/links/${linkId}/checkAvailableHashes`,
        data
    };
};

export const queryGetLink = (ShareID: string, LinkID: string) => ({
    method: 'get',
    url: `drive/shares/${ShareID}/links/${LinkID}`
});

export const queryTrashLink = (ShareID: string, LinkID: string) => ({
    method: 'delete',
    url: `drive/shares/${ShareID}/links/${LinkID}`
});

export const queryRestoreLink = (ShareID: string, LinkID: string) => ({
    method: 'put',
    url: `drive/shares/${ShareID}/trash/${LinkID}`
});

export const queryDeleteLink = (ShareID: string, LinkID: string) => ({
    method: 'delete',
    url: `drive/shares/${ShareID}/trash/${LinkID}`
});

export const queryCheckAvailableHashes = (shareId: string, linkId: string, data: { Hashes: string[] }) => {
    return {
        method: 'post',
        timeout: 60000,
        url: `drive/shares/${shareId}/links/${linkId}/checkAvailableHashes`,
        data
    };
};

export const queryGetLink = (ShareID: string, LinkID: string) => ({
    method: 'get',
    url: `drive/shares/${ShareID}/links/${LinkID}`
});

export const queryTrashLinks = (ShareID: string, ParentLinkID: string, LinkIDs: string[], Force = 0) => ({
    method: 'post',
    url: `drive/shares/${ShareID}/folders/${ParentLinkID}/delete_multiple`,
    data: { LinkIDs, Force }
});

export const queryDeleteLinks = (ShareID: string, LinkIDs: string[]) => ({
    method: 'post',
    url: `drive/shares/${ShareID}/trash/delete_multiple`,
    data: { LinkIDs }
});

export const queryRestoreLinks = (ShareID: string, LinkIDs: string[]) => ({
    method: 'put',
    url: `drive/shares/${ShareID}/trash/restore_multiple`,
    data: { LinkIDs }
});

export const queryEmptyTrashOfShare = (ShareID: string) => ({
    method: 'delete',
    url: `/drive/shares/${ShareID}/trash`
});

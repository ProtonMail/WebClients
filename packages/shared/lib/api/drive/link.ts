import { EXPENSIVE_REQUEST_TIMEOUT } from '../../drive/constants';

export const queryCheckAvailableHashes = (
    shareId: string,
    linkId: string,
    data: { Hashes: string[] },
    suppressErrors = false
) => {
    return {
        method: 'post',
        timeout: EXPENSIVE_REQUEST_TIMEOUT,
        url: `drive/shares/${shareId}/links/${linkId}/checkAvailableHashes`,
        suppress: suppressErrors,
        data,
    };
};

export const queryGetLink = (ShareID: string, LinkID: string) => ({
    method: 'get',
    url: `drive/shares/${ShareID}/links/${LinkID}`,
});

export const queryTrashLinks = (VolumeID: string, LinkIDs: string[]) => ({
    method: 'post',
    url: `drive/v2/volumes/${VolumeID}/trash_multiple`,
    data: { LinkIDs },
});

export const queryDeleteTrashedLinks = (VolumeID: string, LinkIDs: string[]) => ({
    method: 'post',
    url: `drive/v2/volumes/${VolumeID}/trash/delete_multiple`,
    data: { LinkIDs },
});

export const queryDeleteChildrenLinks = (ShareID: string, ParentLinkID: string, LinkIDs: string[]) => ({
    method: 'post',
    url: `drive/shares/${ShareID}/folders/${ParentLinkID}/delete_multiple`,
    data: { LinkIDs },
});

export const queryRestoreLinks = (VolumeID: string, LinkIDs: string[]) => ({
    method: 'put',
    url: `drive/v2/volumes/${VolumeID}/trash/restore_multiple`,
    data: { LinkIDs },
});

export const queryLinkMetaBatch = (shareId: string, linksIds: string[], loadThumbnails: boolean = false) => ({
    method: 'post',
    url: `drive/shares/${shareId}/links/fetch_metadata`,
    data: { LinkIDs: linksIds, Thumbnails: loadThumbnails ? 1 : 0 },
});

export const queryVolumeLinkMetaBatch = (volumeId: string, linksIds: string[], loadThumbnails: boolean = false) => ({
    method: 'post',
    url: `drive/volumes/${volumeId}/links/fetch_metadata`,
    data: { LinkIDs: linksIds, Thumbnails: loadThumbnails ? 1 : 0 },
});

export const queryShareMap = (shareID: string, lastIndex?: number, sessionName?: string, pageSize?: number) => ({
    url: `drive/shares/${shareID}/map`,
    method: 'get',
    params: {
        LastIndex: lastIndex,
        SessionName: sessionName,
        PageSize: pageSize,
    },
});

export const queryUserLinkAccess = ({
    volumeId,
    shareId,
    linkId,
}: {
    volumeId?: string;
    shareId: string;
    linkId: string;
}) => ({
    method: 'get',
    url: `drive/v2/user-link-access`,
    params: {
        VolumeID: volumeId,
        ShareID: shareId,
        LinkID: linkId,
    },
});

/** Public **/
export const queryPublicCheckAvailableHashes = (
    token: string,
    linkId: string,
    data: { Hashes: string[] },
    suppressErrors = false
) => {
    return {
        method: 'post',
        timeout: EXPENSIVE_REQUEST_TIMEOUT,
        url: `drive/urls/${token}/files/${linkId}/checkAvailableHashes`,
        suppress: suppressErrors,
        data,
    };
};

export const queryPublicDeleteChildrenLinks = (
    token: string,
    parentLinkId: string,
    links: {
        LinkID: string;
        AuthorizationToken?: string;
    }[]
) => ({
    method: 'post',
    url: `drive/urls/${token}/folders/${parentLinkId}/delete_multiple`,
    data: { Links: links },
});

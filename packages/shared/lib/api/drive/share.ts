import { EXPENSIVE_REQUEST_TIMEOUT } from '../../drive/constants';
import { MoveLink } from '../../interfaces/drive/link';
import { CreateDrivePhotosShare, CreateDriveShare } from '../../interfaces/drive/share';

export const queryCreateShare = (volumeID: string, data: CreateDriveShare) => ({
    method: 'post',
    url: `drive/volumes/${volumeID}/shares`,
    data,
});
export const queryCreatePhotosShare = (volumeID: string, data: CreateDrivePhotosShare) => ({
    method: 'post',
    url: `drive/volumes/${volumeID}/photos/share`,
    data,
});

export const queryUserShares = (ShowAll = 1) => ({
    method: 'get',
    url: 'drive/shares',
    silence: true,
    params: { ShowAll },
});

export const queryShareMeta = (shareID: string) => ({
    method: `get`,
    url: `drive/shares/${shareID}`,
});

export const queryRenameLink = (
    shareID: string,
    linkID: string,
    data: { Name: string; MIMEType?: string; Hash: string; SignatureAddress: string; OriginalHash: string }
) => ({
    method: `put`,
    url: `drive/shares/${shareID}/links/${linkID}/rename`,
    data,
});

export const queryMoveLink = (shareID: string, linkID: string, data: MoveLink) => ({
    method: 'put',
    url: `drive/shares/${shareID}/links/${linkID}/move`,
    data,
});

export const queryEvents = (shareID: string, eventID: string) => ({
    timeout: EXPENSIVE_REQUEST_TIMEOUT,
    url: `drive/shares/${shareID}/events/${eventID}`,
    method: 'get',
});

export const queryLatestEvents = (shareID: string) => ({
    url: `drive/shares/${shareID}/events/latest`,
    method: 'get',
});

export const queryDeleteShare = (shareID: string) => ({
    url: `drive/shares/${shareID}`,
    method: 'delete',
});

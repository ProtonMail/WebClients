import { FOLDER_PAGE_SIZE } from '../constants';

export const queryUserShares = () => ({
    method: 'get',
    url: 'drive/shares'
});

export const queryShareMeta = (shareID: string) => ({
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

export const queryTrashList = (
    shareID: string,
    { Page, PageSize = FOLDER_PAGE_SIZE }: { Page: number; PageSize?: number }
) => ({
    method: 'get',
    url: `drive/shares/${shareID}/trash`,
    params: { Page, PageSize }
});

export const queryEvents = (shareID: string, eventID: string) => ({
    url: `drive/shares/${shareID}/events/${eventID}`,
    method: 'get'
});

export const queryLatestEvents = (shareID: string) => ({
    url: `drive/shares/${shareID}/events/latest`,
    method: 'get'
});

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
